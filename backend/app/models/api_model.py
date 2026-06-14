from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4


class ApiModel(SQLModel, table=True):
    __tablename__ = "api_models"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    api_provider: str = Field(index=True, max_length=50)  # gemini, google_stt, google_tts
    model_name: str = Field(max_length=100)
    model_version: Optional[str] = Field(default=None, max_length=50)
    endpoint_url: Optional[str] = Field(default=None, max_length=512)
    is_active: bool = Field(default=True, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ApiModelCreate(SQLModel):
    api_provider: str
    model_name: str
    model_version: Optional[str] = None
    endpoint_url: Optional[str] = None
    is_active: bool = True


class ApiModelRead(SQLModel):
    id: UUID
    api_provider: str
    model_name: str
    model_version: Optional[str]
    endpoint_url: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ApiModelUpdate(SQLModel):
    model_version: Optional[str] = None
    endpoint_url: Optional[str] = None
    is_active: Optional[bool] = None
