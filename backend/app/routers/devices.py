from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime
from uuid import UUID

from app.database import get_session
from app.models.user import User
from app.models.device import Device, DeviceRead, DeviceUpdate
from app.utils.deps import get_current_user

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("", response_model=list[DeviceRead])
async def list_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    devices = (await db.exec(
        select(Device)
        .where(Device.user_id == current_user.id)
        .order_by(Device.last_used_at.desc())
    )).all()
    return devices


@router.post("/{device_id}/approve", response_model=DeviceRead)
async def approve_device(
    device_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    device = await db.get(Device, device_id)
    if not device or device.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Device not found")
    device.is_approved = True
    device.updated_at = datetime.utcnow()
    db.add(device)
    await db.commit()
    await db.refresh(device)
    return device


@router.patch("/{device_id}", response_model=DeviceRead)
async def update_device(
    device_id: UUID,
    payload: DeviceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    device = await db.get(Device, device_id)
    if not device or device.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Device not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(device, key, value)
    device.updated_at = datetime.utcnow()
    db.add(device)
    await db.commit()
    await db.refresh(device)
    return device


@router.delete("/{device_id}")
async def delete_device(
    device_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    device = await db.get(Device, device_id)
    if not device or device.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Device not found")
    await db.delete(device)
    await db.commit()
    return {"message": "Device removed"}
