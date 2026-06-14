import asyncio
from google.cloud import speech_v2 as speech
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from uuid import UUID

from app.config import get_settings
from app.models.api_model import ApiModel
from app.services.cost_tracker import CostTracker

settings = get_settings()


class STTService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = speech.SpeechClient()

    async def _get_active_model(self) -> tuple[str, str]:
        stmt = select(ApiModel).where(
            ApiModel.api_provider == "google_stt",
            ApiModel.is_active == True,
        )
        record = (await self.db.exec(stmt)).first()
        if record:
            return record.model_name, record.model_version or "latest"
        return settings.google_stt_model, "latest"

    async def transcribe(
        self,
        user_id: UUID,
        audio_bytes: bytes,
        audio_duration_ms: int,
        language_code: str = "en-IN",
        conversation_id: Optional[UUID] = None,
    ) -> dict:
        model_name, _ = await self._get_active_model()
        cost_tracker = CostTracker(self.db)

        config = speech.RecognitionConfig(
            auto_decoding_config=speech.AutoDetectDecodingConfig(),
            language_codes=[language_code, "ta-IN"],
            model="latest_long",
        )
        request = speech.RecognizeRequest(
            recognizer=f"projects/{settings.google_cloud_project_id}/locations/global/recognizers/_",
            config=config,
            content=audio_bytes,
        )

        response = await asyncio.to_thread(self.client.recognize, request=request)

        transcript = " ".join(
            result.alternatives[0].transcript
            for result in response.results
            if result.alternatives
        )

        cost = await cost_tracker.calculate_stt_cost(audio_duration_ms)
        await cost_tracker.log_api_call(
            user_id=user_id,
            provider="google_stt",
            cost=cost,
            api_endpoint="speech.googleapis.com/v2/recognize",
            conversation_id=conversation_id,
            audio_duration_ms=audio_duration_ms,
        )

        if conversation_id:
            await cost_tracker.update_conversation_cost(conversation_id, cost)

        return {
            "transcript": transcript,
            "audio_duration_ms": audio_duration_ms,
            "cost": cost,
        }
