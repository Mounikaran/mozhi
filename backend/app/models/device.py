from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4


class Device(SQLModel, table=True):
    __tablename__ = "devices"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    fingerprint: str = Field(index=True, max_length=255)
    device_name: Optional[str] = Field(default=None, max_length=100)
    device_type: Optional[str] = Field(default=None, max_length=50)  # desktop/tablet/mobile
    browser_name: Optional[str] = Field(default=None, max_length=100)
    os_name: Optional[str] = Field(default=None, max_length=100)
    ip_address: Optional[str] = Field(default=None, max_length=45)
    is_approved: bool = Field(default=False)
    last_used_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DeviceRead(SQLModel):
    id: UUID
    user_id: UUID
    fingerprint: str
    device_name: Optional[str]
    device_type: Optional[str]
    browser_name: Optional[str]
    os_name: Optional[str]
    ip_address: Optional[str]
    is_approved: bool
    last_used_at: Optional[datetime]
    created_at: datetime


class DeviceUpdate(SQLModel):
    device_name: Optional[str] = None
    is_approved: Optional[bool] = None
