from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    session_id: UUID = Field(foreign_key="sessions.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    topic: Optional[str] = Field(default=None, max_length=255)
    skill_tags: Optional[list] = Field(default=None, sa_column=Column(JSON))
    conversation_data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    total_cost: float = Field(default=0.0)
    duration_seconds: Optional[int] = Field(default=None)


class ConversationCreate(SQLModel):
    session_id: Optional[UUID] = None  # ignored; backend resolves the active login session
    topic: Optional[str] = None
    skill_tags: Optional[list[str]] = None


class ConversationRead(SQLModel):
    id: UUID
    user_id: UUID
    session_id: UUID
    created_at: datetime
    topic: Optional[str]
    skill_tags: Optional[list]
    total_cost: float
    duration_seconds: Optional[int]


class ConversationUpdate(SQLModel):
    topic: Optional[str] = None
    skill_tags: Optional[list[str]] = None
    conversation_data: Optional[dict] = None
    total_cost: Optional[float] = None
    duration_seconds: Optional[int] = None
