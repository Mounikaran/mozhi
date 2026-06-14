from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4


class UserSession(SQLModel, table=True):
    __tablename__ = "sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    device_id: Optional[UUID] = Field(default=None, foreign_key="devices.id", index=True)
    login_timestamp: datetime = Field(default_factory=datetime.utcnow)
    logout_timestamp: Optional[datetime] = Field(default=None)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    user_agent: Optional[str] = Field(default=None, max_length=512)
    is_active: bool = Field(default=True, index=True)


class SessionRead(SQLModel):
    id: UUID
    user_id: UUID
    device_id: Optional[UUID]
    login_timestamp: datetime
    logout_timestamp: Optional[datetime]
    ip_address: Optional[str]
    is_active: bool
