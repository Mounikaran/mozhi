from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.database import get_session
from app.models.user import User, UserCreate, UserRead
from app.models.device import Device
from app.models.session import UserSession
from app.utils.auth import hash_password, verify_password, create_access_token
from app.utils.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str
    device_fingerprint: str
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    browser_name: Optional[str] = None
    os_name: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
    device_approved: bool


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, request: Request, db: AsyncSession = Depends(get_session)):
    if (await db.exec(select(User).where(User.email == payload.email))).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if (await db.exec(select(User).where(User.username == payload.username))).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=payload.email,
        username=payload.username,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return AuthResponse(
        access_token=token,
        user=UserRead.model_validate(user),
        device_approved=False,
    )


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_session)):
    user = (await db.exec(select(User).where(User.email == payload.email))).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    ip_address = request.client.host if request.client else None

    device = (await db.exec(
        select(Device).where(
            Device.user_id == user.id,
            Device.fingerprint == payload.device_fingerprint,
        )
    )).first()

    if device:
        device.last_used_at = datetime.utcnow()
        device.ip_address = ip_address
        device.updated_at = datetime.utcnow()
    else:
        device = Device(
            user_id=user.id,
            fingerprint=payload.device_fingerprint,
            device_name=payload.device_name,
            device_type=payload.device_type,
            browser_name=payload.browser_name,
            os_name=payload.os_name,
            ip_address=ip_address,
            is_approved=False,
            last_used_at=datetime.utcnow(),
        )
    db.add(device)
    await db.commit()
    await db.refresh(device)

    session = UserSession(
        user_id=user.id,
        device_id=device.id,
        ip_address=ip_address,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(session)
    await db.commit()

    token = create_access_token({"sub": str(user.id), "session_id": str(session.id)})
    return AuthResponse(
        access_token=token,
        user=UserRead.model_validate(user),
        device_approved=device.is_approved,
    )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    session = (await db.exec(
        select(UserSession).where(
            UserSession.user_id == current_user.id,
            UserSession.is_active == True,
        ).order_by(UserSession.login_timestamp.desc())
    )).first()
    if session:
        session.is_active = False
        session.logout_timestamp = datetime.utcnow()
        db.add(session)
        await db.commit()
    return {"message": "Logged out successfully"}


@router.post("/approve-device/{device_id}")
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
    return {"message": "Device approved"}


@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
