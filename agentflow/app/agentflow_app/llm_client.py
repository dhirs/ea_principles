"""Anthropic/OpenAI client wrapper with retries, structured outputs, tracing.

Routes by model-name prefix: ``gpt*`` -> OpenAI, ``claude*`` -> Anthropic.

When an ``output_contract`` is passed and the provider is OpenAI, the call uses
the **Responses API with Structured Outputs**: the contract's hint-dict is
converted to a strict JSON Schema and the model is *forced* to return exactly
that shape (no more guessed field names). If the schema is rejected, it falls
back to a plain call with the schema appended to the prompt as text.

SDKs are imported lazily and LangSmith-wrapped when tracing is on, so tests
(which inject a mock) need neither package nor an API key.
"""
from __future__ import annotations

import json
import os
import re
import time

from . import env
from .schema_convert import to_json_schema


class LLMError(RuntimeError):
    pass


def _sanitize_name(name: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_]", "_", name)[:60] or "response"


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
    def complete(
        self,
        model: str,
        system: str,
        user: str,
        max_tokens: int = 8192,
        *,
        contract: dict | None = None,
        schema_name: str = "response",
        run_name: str | None = None,
        trace_metadata: dict | None = None,
    ) -> str:
        last_exc: Exception | None = None
        for attempt in range(self.max_attempts):
            try:
                if model.startswith("gpt"):
                    return self._complete_openai(model, system, user, max_tokens, contract, schema_name, run_name, trace_metadata)
                if model.startswith("claude"):
                    return self._complete_anthropic(model, system, user, max_tokens, contract, run_name, trace_metadata)
                raise LLMError(f"unknown model/provider for: {model}")
            except LLMError:
                raise
            except Exception as e:  # transient: rate limit / 5xx / network
                last_exc = e
                if attempt < self.max_attempts - 1:
                    time.sleep(self.base_delay * (2 ** attempt))
        raise LLMError(f"LLM call failed after {self.max_attempts} attempts: {last_exc}")

    def _trace_kwargs(self, run_name, trace_metadata) -> dict:
        """Per-call LangSmith run name/metadata. Only valid on a wrapped client,
        so gated on tracing being enabled (raw SDK would reject the kwarg)."""
        if env.tracing_enabled() and run_name:
            return {"langsmith_extra": {"name": run_name, "metadata": trace_metadata or {}, "tags": [run_name]}}
        return {}

    # --- OpenAI: Responses API + Structured Outputs -----------------------
    def _complete_openai(self, model, system, user, max_tokens, contract, schema_name, run_name=None, trace_metadata=None) -> str:
        client = self._openai_client()
        trace = self._trace_kwargs(run_name, trace_metadata)
        schema = None
        if contract and isinstance(contract.get("schema"), dict):
            try:
                schema = to_json_schema(contract["schema"])
            except Exception:
                schema = None

        if schema is not None:
            try:
                resp = client.responses.create(
                    model=model,
                    instructions=system,
                    input=user,
                    max_output_tokens=max_tokens,
                    text={
                        "format": {
                            "type": "json_schema",
                            "name": _sanitize_name(schema_name),
                            "schema": schema,
                            "strict": True,
                        }
                    },
                    **trace,
                )
                return resp.output_text
            except Exception as e:
                import openai

                if not isinstance(e, openai.BadRequestError):
                    raise  # transient -> let the retry loop handle it
                # strict schema rejected: fall through to plain prompt + schema text

        # Plain call (no structured output): append the contract as text so the
        # model still sees the exact keys.
        prompt = user
        if contract and isinstance(contract.get("schema"), dict):
            prompt += "\n\nOUTPUT CONTRACT — return ONE JSON object with EXACTLY these keys (no markdown):\n" + json.dumps(contract["schema"], indent=2, ensure_ascii=False)
        resp = client.responses.create(model=model, instructions=system, input=prompt, max_output_tokens=max_tokens, **trace)
        return resp.output_text

    # --- Anthropic --------------------------------------------------------
    def _complete_anthropic(self, model, system, user, max_tokens, contract, run_name=None, trace_metadata=None) -> str:
        prompt = user
        if contract and isinstance(contract.get("schema"), dict):
            prompt += "\n\nOUTPUT CONTRACT — return ONE JSON object with EXACTLY these keys (no markdown):\n" + json.dumps(contract["schema"], indent=2, ensure_ascii=False)
        resp = self._anthropic_client().messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": prompt}],
            **self._trace_kwargs(run_name, trace_metadata),
        )
        return "".join(block.text for block in resp.content if block.type == "text")
