"""Two entrypoints: the guarded path (correct) and the unguarded path (the bypass demo).

`unguarded_chat` is the failure ST-GS4B2-01's routed-input AST lint forbids — raw user input
straight to the model. It exists here only so the wiring test can show the same attack that is
blocked on the guarded path sails through here.
"""
from .config import load_config
from .guardrail import screen
from . import model_client


def guarded_chat(user_input: str, caller_id: str = "anon") -> dict:
    """Correct path: screen, then call the model only if it passes; else the on_trip fallback."""
    cfg = load_config()
    result = screen(user_input, caller_id, cfg)
    if result.tripped:
        return {
            "blocked": True,
            "tripped_layer": result.layer,
            "reason": result.reason,
            "response": cfg["on_trip_message"],   # block_and_replace — never the raw model call
        }
    return {"blocked": False, "response": model_client.generate(user_input)}


def unguarded_chat(user_input: str) -> dict:
    """BYPASS — DO NOT SHIP. Raw user input straight to the model, no screening."""
    return {"blocked": False, "response": model_client.generate(user_input)}
