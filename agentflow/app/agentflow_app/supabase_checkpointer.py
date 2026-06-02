"""A LangGraph checkpointer backed by the Supabase REST API.

Why this exists: the project's Supabase direct DB host is IPv6-only and the dev
box has no IPv6 route, so the standard ``PostgresSaver`` (a raw Postgres driver)
can't connect. The REST API (``SUPABASE_URL`` + secret ``SUPABASE_KEY``) is
reachable over IPv4, so this checkpointer stores the same checkpoint data through
PostgREST instead of a Postgres wire connection.

It implements the synchronous ``BaseCheckpointSaver`` surface (put / put_writes /
get_tuple / list), which is all a synchronous ``graph.invoke()`` needs. The data
model mirrors the official saver: one row per checkpoint plus one row per pending
write. Serialized blobs are base64-encoded so they survive JSON transport.

Tables required (create once via the Supabase SQL editor — see schema.sql):
``lg_checkpoints`` and ``lg_writes``.
"""
from __future__ import annotations

import base64
from typing import Any, Iterator, Optional, Sequence

from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    ChannelVersions,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    get_checkpoint_id,
)
from supabase import Client, create_client

CHECKPOINTS_TABLE = "lg_checkpoints"
WRITES_TABLE = "lg_writes"


def _b64e(b: bytes) -> str:
    return base64.b64encode(b).decode("ascii")


def _b64d(s: str) -> bytes:
    return base64.b64decode(s.encode("ascii"))


class SupabaseCheckpointer(BaseCheckpointSaver):
    """Persist LangGraph checkpoints through the Supabase REST API."""

    def __init__(self, client: Client, *, serde=None):
        super().__init__(serde=serde)
        self.client = client

    # --- construction -----------------------------------------------------
    @classmethod
    def from_credentials(cls, url: str, key: str, *, serde=None) -> "SupabaseCheckpointer":
        return cls(create_client(url, key), serde=serde)

    # --- helpers ----------------------------------------------------------
    def _load_writes(self, thread_id: str, ns: str, checkpoint_id: str):
        rows = (
            self.client.table(WRITES_TABLE)
            .select("*")
            .eq("thread_id", thread_id)
            .eq("checkpoint_ns", ns)
            .eq("checkpoint_id", checkpoint_id)
            .order("task_id")
            .order("idx")
            .execute()
            .data
        )
        return [
            (w["task_id"], w["channel"], self.serde.loads_typed((w["type"], _b64d(w["value"]))))
            for w in rows
        ]

    def _row_to_tuple(self, row: dict) -> CheckpointTuple:
        thread_id = row["thread_id"]
        ns = row["checkpoint_ns"]
        checkpoint = self.serde.loads_typed((row["type"], _b64d(row["checkpoint"])))
        metadata = (
            self.serde.loads_typed((row["metadata_type"], _b64d(row["metadata"])))
            if row.get("metadata")
            else {}
        )
        parent_config = None
        if row.get("parent_checkpoint_id"):
            parent_config = {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": ns,
                    "checkpoint_id": row["parent_checkpoint_id"],
                }
            }
        return CheckpointTuple(
            config={
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": ns,
                    "checkpoint_id": row["checkpoint_id"],
                }
            },
            checkpoint=checkpoint,
            metadata=metadata,
            parent_config=parent_config,
            pending_writes=self._load_writes(thread_id, ns, row["checkpoint_id"]),
        )

    def list_threads(self) -> list[str]:
        """Distinct thread_ids that have checkpoints (for the CLI `list` command)."""
        rows = self.client.table(CHECKPOINTS_TABLE).select("thread_id").execute().data
        return sorted({r["thread_id"] for r in rows})

    # --- read -------------------------------------------------------------
    def get_tuple(self, config) -> Optional[CheckpointTuple]:
        cfg = config["configurable"]
        thread_id = cfg["thread_id"]
        ns = cfg.get("checkpoint_ns", "")
        checkpoint_id = get_checkpoint_id(config)

        q = (
            self.client.table(CHECKPOINTS_TABLE)
            .select("*")
            .eq("thread_id", thread_id)
            .eq("checkpoint_ns", ns)
        )
        if checkpoint_id:
            q = q.eq("checkpoint_id", checkpoint_id)
        else:
            q = q.order("checkpoint_id", desc=True).limit(1)

        rows = q.execute().data
        if not rows:
            return None
        return self._row_to_tuple(rows[0])

    def list(
        self,
        config,
        *,
        filter: Optional[dict[str, Any]] = None,
        before=None,
        limit: Optional[int] = None,
    ) -> Iterator[CheckpointTuple]:
        q = self.client.table(CHECKPOINTS_TABLE).select("*")
        if config and "configurable" in config:
            cfg = config["configurable"]
            if cfg.get("thread_id"):
                q = q.eq("thread_id", cfg["thread_id"])
            if "checkpoint_ns" in cfg:
                q = q.eq("checkpoint_ns", cfg["checkpoint_ns"])
        if before and before.get("configurable", {}).get("checkpoint_id"):
            q = q.lt("checkpoint_id", before["configurable"]["checkpoint_id"])
        q = q.order("checkpoint_id", desc=True)
        if limit:
            q = q.limit(limit)
        for row in q.execute().data:
            yield self._row_to_tuple(row)

    # --- write ------------------------------------------------------------
    def put(
        self,
        config,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ):
        cfg = config["configurable"]
        thread_id = cfg["thread_id"]
        ns = cfg.get("checkpoint_ns", "")
        checkpoint_id = checkpoint["id"]

        cp_type, cp_bytes = self.serde.dumps_typed(checkpoint)
        md_type, md_bytes = self.serde.dumps_typed(metadata)

        self.client.table(CHECKPOINTS_TABLE).upsert(
            {
                "thread_id": thread_id,
                "checkpoint_ns": ns,
                "checkpoint_id": checkpoint_id,
                "parent_checkpoint_id": cfg.get("checkpoint_id"),
                "type": cp_type,
                "checkpoint": _b64e(cp_bytes),
                "metadata_type": md_type,
                "metadata": _b64e(md_bytes),
            }
        ).execute()

        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": ns,
                "checkpoint_id": checkpoint_id,
            }
        }

    def put_writes(
        self,
        config,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        cfg = config["configurable"]
        rows = []
        for idx, (channel, value) in enumerate(writes):
            v_type, v_bytes = self.serde.dumps_typed(value)
            rows.append(
                {
                    "thread_id": cfg["thread_id"],
                    "checkpoint_ns": cfg.get("checkpoint_ns", ""),
                    "checkpoint_id": cfg["checkpoint_id"],
                    "task_id": task_id,
                    "idx": idx,
                    "channel": channel,
                    "type": v_type,
                    "value": _b64e(v_bytes),
                }
            )
        if rows:
            self.client.table(WRITES_TABLE).upsert(rows).execute()
