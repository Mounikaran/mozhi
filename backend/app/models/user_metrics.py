from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date
from uuid import UUID, uuid4


class UserMetrics(SQLModel, table=True):
    __tablename__ = "user_metrics"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    metric_date: date = Field(index=True)
    total_conversations: int = Field(default=0)
    total_duration_seconds: int = Field(default=0)
    total_cost: float = Field(default=0.0)
    streak_count: int = Field(default=0)
    session_score: float = Field(default=0.0)


class UserMetricsRead(SQLModel):
    id: UUID
    user_id: UUID
    metric_date: date
    total_conversations: int
    total_duration_seconds: int
    total_cost: float
    streak_count: int
    session_score: float
