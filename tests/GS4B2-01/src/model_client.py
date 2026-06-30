"""The foundation-model call.

Stub by default — proving wiring + efficacy does NOT need a real model, because the
guardrail screens BEFORE the model is ever called. Implement a real provider as a TODO.
"""
import os


def generate(prompt: str) -> str:
    """Return a model completion for `prompt`.

    TODO (Claude Code, optional): call a real provider when MODEL_API_KEY is set, e.g.
        from anthropic import Anthropic
        client = Anthropic(api_key=os.environ["MODEL_API_KEY"])
        return client.messages.create(...).content[0].text
    """
    if os.environ.get("MODEL_API_KEY"):
        raise NotImplementedError("Real model provider not wired yet — see model_client.py TODO")
    # Offline stub: echoes that the model WAS reached (used to prove the bypass path).
    return f"[STUB MODEL OUTPUT] processed: {prompt[:80]!r}"
