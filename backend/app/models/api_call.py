from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4


class ApiCall(SQLModel, table=True):
    __tablename__ = "api_calls"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    conversation_id: Optional[UUID] = Field(default=None, foreign_key="conversations.id")
    api_provider: str = Field(index=True, max_length=50)  # gemini, google_stt, google_tts
    api_endpoint: str = Field(max_length=512)
    request_tokens: Optional[int] = Field(default=None)
    response_tokens: Optional[int] = Field(default=None)
    total_tokens: Optional[int] = Field(default=None)
    audio_duration_ms: Optional[int] = Field(default=None)
    character_count: Optional[int] = Field(default=None)
    cost: float
    cost_currency: str = Field(default="USD", max_length=10)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    status: str = Field(default="success", max_length=50)


class ApiCallRead(SQLModel):
    id: UUID
    user_id: UUID
    conversation_id: Optional[UUID]
    api_provider: str
    api_endpoint: str
    request_tokens: Optional[int]
    response_tokens: Optional[int]
    total_tokens: Optional[int]
    audio_duration_ms: Optional[int]
    character_count: Optional[int]
    cost: float
    cost_currency: str
    timestamp: datetime
    status: str
