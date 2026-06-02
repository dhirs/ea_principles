"""Pydantic state models for the per-principle pipeline (app-level checkpoint)."""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class SectionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    RATIFIED = "ratified"
    HARD_FAILED_AWAITING_HUMAN = "hard_failed_awaiting_human"
    SKIPPED = "skipped"


class PipelineStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    AWAITING_HUMAN = "awaiting_human"
    ABANDONED = "abandoned"


class SectionState(BaseModel):
    status: SectionStatus = SectionStatus.PENDING
    draft: dict | None = None
    last_draft: dict | None = None
    last_rubric_scores: dict | None = None
    retry_count: int = 0
    ratified_at: datetime | None = None
    failed_at: datetime | None = None


class PipelineState(BaseModel):
    principle_id: str
    aws_anchor: dict
    pillar: str = ""
    focus_area: str = ""
    sibling_sections: dict = Field(default_factory=dict)
    section_states: dict[str, SectionState] = Field(default_factory=dict)
    status: PipelineStatus = PipelineStatus.IN_PROGRESS
    started_at: datetime | None = None
    completed_at: datetime | None = None
