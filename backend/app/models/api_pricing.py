from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4


class ApiPricing(SQLModel, table=True):
    __tablename__ = "api_pricing"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    api_provider: str = Field(index=True, max_length=50)  # gemini, google_stt, google_tts
    model_name: Optional[str] = Field(default=None, max_length=100)
    pricing_type: str = Field(max_length=50)  # per_token_input, per_token_output, per_minute, per_character, per_15sec
    cost: float  # stored as float; precision handled at application layer
    currency: str = Field(default="USD", max_length=10)
    effective_date: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True, index=True)
    notes: Optional[str] = Field(default=None, max_length=512)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ApiPricingCreate(SQLModel):
    api_provider: str
    model_name: Optional[str] = None
    pricing_type: str
    cost: float
    currency: str = "USD"
    effective_date: Optional[datetime] = None
    is_active: bool = True
    notes: Optional[str] = None


class ApiPricingRead(SQLModel):
    id: UUID
    api_provider: str
    model_name: Optional[str]
    pricing_type: str
    cost: float
    currency: str
    effective_date: datetime
    is_active: bool
    notes: Optional[str]
    updated_at: datetime


class ApiPricingUpdate(SQLModel):
    cost: Optional[float] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
