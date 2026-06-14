from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime, timedelta
from uuid import UUID
from typing import Optional

from app.database import get_session
from app.models.user import User, UserRead
from app.models.device import Device, DeviceRead, DeviceUpdate
from app.models.api_pricing import ApiPricing, ApiPricingCreate, ApiPricingRead, ApiPricingUpdate
from app.models.api_model import ApiModel, ApiModelCreate, ApiModelRead, ApiModelUpdate
from app.models.api_call import ApiCall, ApiCallRead
from app.models.conversation import Conversation
from app.utils.deps import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Users ──────────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserRead])
async def list_users(
    limit: int = 50,
    offset: int = 0,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    return (await db.exec(select(User).offset(offset).limit(limit))).all()


@router.patch("/users/{user_id}/toggle-admin", response_model=UserRead)
async def toggle_admin(
    user_id: UUID,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_admin = not user.is_admin
    user.updated_at = datetime.utcnow()
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ── Devices ────────────────────────────────────────────────────────────────

@router.get("/devices", response_model=list[DeviceRead])
async def list_all_devices(
    approved_only: Optional[bool] = None,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    stmt = select(Device)
    if approved_only is not None:
        stmt = stmt.where(Device.is_approved == approved_only)
    return (await db.exec(stmt)).all()


@router.post("/devices/{device_id}/approve", response_model=DeviceRead)
async def admin_approve_device(
    device_id: UUID,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    device = await db.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    device.is_approved = True
    device.updated_at = datetime.utcnow()
    db.add(device)
    await db.commit()
    await db.refresh(device)
    return device


@router.delete("/devices/{device_id}")
async def admin_revoke_device(
    device_id: UUID,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    device = await db.get(Device, device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    await db.delete(device)
    await db.commit()
    return {"message": "Device revoked"}


# ── API Pricing ────────────────────────────────────────────────────────────

@router.get("/api-pricing", response_model=list[ApiPricingRead])
async def list_pricing(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    return (await db.exec(select(ApiPricing).order_by(ApiPricing.api_provider, ApiPricing.model_name))).all()


@router.post("/api-pricing", response_model=ApiPricingRead, status_code=201)
async def create_pricing(
    payload: ApiPricingCreate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    pricing = ApiPricing(**payload.model_dump())
    db.add(pricing)
    await db.commit()
    await db.refresh(pricing)
    return pricing


@router.patch("/api-pricing/{pricing_id}", response_model=ApiPricingRead)
async def update_pricing(
    pricing_id: UUID,
    payload: ApiPricingUpdate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    pricing = await db.get(ApiPricing, pricing_id)
    if not pricing:
        raise HTTPException(status_code=404, detail="Pricing rule not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(pricing, key, value)
    pricing.updated_at = datetime.utcnow()
    db.add(pricing)
    await db.commit()
    await db.refresh(pricing)
    return pricing


# ── API Models ─────────────────────────────────────────────────────────────

@router.get("/api-models", response_model=list[ApiModelRead])
async def list_api_models(
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    return (await db.exec(select(ApiModel).order_by(ApiModel.api_provider, ApiModel.model_name))).all()


@router.post("/api-models", response_model=ApiModelRead, status_code=201)
async def create_api_model(
    payload: ApiModelCreate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    model = ApiModel(**payload.model_dump())
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return model


@router.patch("/api-models/{model_id}", response_model=ApiModelRead)
async def update_api_model(
    model_id: UUID,
    payload: ApiModelUpdate,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    model = await db.get(ApiModel, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="API model not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(model, key, value)
    model.updated_at = datetime.utcnow()
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return model


# ── Cost Reports ───────────────────────────────────────────────────────────

@router.get("/cost-report")
async def cost_report(
    days: int = 30,
    _: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session),
):
    since = datetime.utcnow() - timedelta(days=days)
    calls = (await db.exec(
        select(ApiCall).where(ApiCall.timestamp >= since).order_by(ApiCall.timestamp.desc())
    )).all()

    by_provider: dict[str, float] = {}
    total = 0.0
    for call in calls:
        by_provider[call.api_provider] = by_provider.get(call.api_provider, 0.0) + call.cost
        total += call.cost

    return {
        "period_days": days,
        "total_cost_usd": round(total, 6),
        "by_provider": {k: round(v, 6) for k, v in by_provider.items()},
        "total_calls": len(calls),
    }
