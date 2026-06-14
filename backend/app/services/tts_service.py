import asyncio
from google.cloud import texttospeech
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from uuid import UUID

from app.config import get_settings
from app.models.api_model import ApiModel
from app.services.cost_tracker import CostTracker

settings = get_settings()

TAMIL_VOICES = {
    "neural": "ta-IN-Neural2-A",
    "standard": "ta-IN-Standard-A",
}


class TTSService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = texttospeech.TextToSpeechClient()

    async def _get_active_model(self) -> str:
        stmt = select(ApiModel).where(
            ApiModel.api_provider == "google_tts",
            ApiModel.is_active == True,
        )
        record = (await self.db.exec(stmt)).first()
        return record.model_name if record else settings.google_tts_model

    async def synthesize(
        self,
        user_id: UUID,
        text: str,
        language_code: str = "ta-IN",
        conversation_id: Optional[UUID] = None,
    ) -> dict:
        model_type = await self._get_active_model()
        voice_name = TAMIL_VOICES.get(model_type, TAMIL_VOICES["neural"])
        cost_tracker = CostTracker(self.db)

        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_name,
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
        )

        response = await asyncio.to_thread(
            self.client.synthesize_speech,
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config,
        )

        character_count = len(text)
        cost = await cost_tracker.calculate_tts_cost(character_count)
        await cost_tracker.log_api_call(
            user_id=user_id,
            provider="google_tts",
            cost=cost,
            api_endpoint="texttospeech.googleapis.com/v1/text:synthesize",
            conversation_id=conversation_id,
            character_count=character_count,
        )

        if conversation_id:
            await cost_tracker.update_conversation_cost(conversation_id, cost)

        return {
            "audio_content": response.audio_content,
            "character_count": character_count,
            "voice_name": voice_name,
            "cost": cost,
        }
