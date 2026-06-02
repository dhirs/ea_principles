"""Environment bootstrap.

Reads the repo-root .env *raw* (line-by-line) and seeds os.environ. We avoid
python-dotenv's interpolation because SUPABASE_PWD contains '$', which would be
mangled as a variable reference. Also flips the LangSmith project to 'agentflow'
unless the caller already set one, so this pipeline's traces are grouped apart
from other projects sharing the same API key.
"""
from __future__ import annotations

import os
import re
from pathlib import Path

from . import config

_LOADED = False


def load_env(*, langsmith_project: str = "agentflow") -> None:
    global _LOADED
    if _LOADED:
        return
    env_path = config.REPO_ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            # Skip LANGCHAIN_PROJECT from .env — this pipeline owns its project
            # name (set below). A real shell export still wins via setdefault.
            if key == "LANGCHAIN_PROJECT":
                continue
            # don't clobber anything already exported in the shell
            os.environ.setdefault(key, val.strip())

    # LangSmith: keep this pipeline's traces in their own project (agentflow),
    # unless the shell explicitly set LANGCHAIN_PROJECT.
    if os.environ.get("LANGCHAIN_TRACING_V2", "").lower() == "true":
        os.environ.setdefault("LANGCHAIN_PROJECT", langsmith_project)
    _LOADED = True


def tracing_enabled() -> bool:
    return os.environ.get("LANGCHAIN_TRACING_V2", "").lower() == "true"
