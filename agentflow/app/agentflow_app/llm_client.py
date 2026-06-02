"""Anthropic/OpenAI client wrapper with retries and LangSmith tracing.

Routes by model-name prefix: ``claude*`` -> Anthropic, ``gpt*`` -> OpenAI, so
either provider works depending on which key is set. When LangSmith tracing is
on, the underlying SDK client is wrapped so each call shows as an LLM span with
tokens/latency under the graph node that made it. SDKs are imported lazily so
tests (which inject a mock) need neither package nor an API key.
"""
from __future__ import annotations

import os
import time

from . import env


class LLMError(RuntimeError):
    pass


class LLMClient:
    def __init__(self, *, max_attempts: int = 5, base_delay: float = 1.0):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self._anthropic = None
        self._openai = None

    # --- provider clients (lazy, optionally LangSmith-wrapped) ------------
    def _anthropic_client(self):
        if self._anthropic is None:
            import anthropic

            client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
            if env.tracing_enabled():
                try:
                    from langsmith.wrappers import wrap_anthropic

                    client = wrap_anthropic(client)
                except Exception:
                    pass
            self._anthropic = client
        return self._anthropic

    def _openai_client(self):
        if self._openai is None:
            import openai

            client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
            if env.tracing_enabled():
                try:
                    from langsmith.wrappers import wrap_openai

                    client = wrap_openai(client)
                except Exception:
                    pass
            self._openai = client
        return self._openai

    # --- public API -------------------------------------------------------
    def complete(self, model: str, system: str, user: str, max_tokens: int = 4096) -> str:
        last_exc: Exception | None = None
        for attempt in range(self.max_attempts):
            try:
                if model.startswith("claude"):
                    return self._complete_anthropic(model, system, user, max_tokens)
                if model.startswith("gpt"):
                    return self._complete_openai(model, system, user, max_tokens)
                raise LLMError(f"unknown model/provider for: {model}")
            except LLMError:
                raise
            except Exception as e:  # transient: rate limit / 5xx / network
                last_exc = e
                if attempt < self.max_attempts - 1:
                    time.sleep(self.base_delay * (2 ** attempt))
        raise LLMError(f"LLM call failed after {self.max_attempts} attempts: {last_exc}")

    def _complete_anthropic(self, model, system, user, max_tokens) -> str:
        resp = self._anthropic_client().messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return "".join(block.text for block in resp.content if block.type == "text")

    def _complete_openai(self, model, system, user, max_tokens) -> str:
        resp = self._openai_client().chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return resp.choices[0].message.content or ""
