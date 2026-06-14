from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from fastapi.responses import Response
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from uuid import UUID

from app.database import get_session
from app.models.user import User
from app.models.conversation import Conversation, ConversationCreate, ConversationRead
from app.models.session import UserSession
from app.services.gemini_service import GeminiService
from app.services.stt_service import STTService
from app.services.tts_service import TTSService
from app.utils.deps import get_current_user

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    conversation_id: Optional[UUID] = Form(None),
    language_code: str = Form("en-IN"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    audio_bytes = await audio.read()
    estimated_ms = max(1000, int(len(audio_bytes) / 4000 * 1000))

    stt = STTService(db)
    result = await stt.transcribe(
        user_id=current_user.id,
        audio_bytes=audio_bytes,
        audio_duration_ms=estimated_ms,
        language_code=language_code,
        conversation_id=conversation_id,
    )
    return result


@router.post("/generate-feedback")
async def generate_feedback(
    transcription: str = Form(...),
    conversation_id: Optional[UUID] = Form(None),
    topic: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    gemini = GeminiService(db)
    feedback = await gemini.evaluate_response(
        user_id=current_user.id,
        transcription=transcription,
        topic=topic,
        conversation_id=conversation_id,
    )
    return feedback


@router.post("/speak")
async def speak_feedback(
    text: str = Form(...),
    conversation_id: Optional[UUID] = Form(None),
    language_code: str = Form("ta-IN"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    tts = TTSService(db)
    result = await tts.synthesize(
        user_id=current_user.id,
        text=text,
        language_code=language_code,
        conversation_id=conversation_id,
    )
    return Response(
        content=result["audio_content"],
        media_type="audio/mpeg",
        headers={
            "X-Cost": str(result["cost"]),
            "X-Character-Count": str(result["character_count"]),
        },
    )


@router.post("/conversations", response_model=ConversationRead)
async def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    # Resolve the user's actual active login session (the FK requires a real sessions.id)
    user_session = (await db.exec(
        select(UserSession)
        .where(UserSession.user_id == current_user.id, UserSession.is_active == True)
        .order_by(UserSession.login_timestamp.desc())
    )).first()

    if not user_session:
        raise HTTPException(status_code=400, detail="No active login session found. Please log in again.")

    conversation = Conversation(
        user_id=current_user.id,
        session_id=user_session.id,
        topic=payload.topic,
        skill_tags=payload.skill_tags or [],
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


@router.get("/conversations", response_model=list[ConversationRead])
async def list_conversations(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    conversations = (await db.exec(
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .offset(offset)
        .limit(limit)
    )).all()
    return conversations
