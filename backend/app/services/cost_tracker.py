from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from datetime import datetime
from uuid import UUID
from typing import Optional

from app.models.api_pricing import ApiPricing
from app.models.api_call import ApiCall
from app.models.conversation import Conversation


class CostTracker:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_active_pricing(self, provider: str, model_name: Optional[str] = None) -> list[ApiPricing]:
        stmt = select(ApiPricing).where(
            ApiPricing.api_provider == provider,
            ApiPricing.is_active == True,
        )
        if model_name:
            stmt = stmt.where(ApiPricing.model_name == model_name)
        return (await self.db.exec(stmt)).all()

    async def calculate_gemini_cost(
        self, input_tokens: int, output_tokens: int, model_name: str = "gemini-1.5-flash"
    ) -> float:
        pricing = await self._get_active_pricing("gemini", model_name)
        input_row = next((p for p in pricing if p.pricing_type == "per_token_input"), None)
        output_row = next((p for p in pricing if p.pricing_type == "per_token_output"), None)

        if not input_row or not output_row:
            raise ValueError(f"Pricing not configured for model: {model_name}")

        return (input_tokens / 1_000_000) * input_row.cost + (output_tokens / 1_000_000) * output_row.cost

    async def calculate_stt_cost(self, audio_duration_ms: int) -> float:
        pricing = await self._get_active_pricing("google_stt")
        price_row = next((p for p in pricing if p.pricing_type == "per_15sec"), None)

        if not price_row:
            raise ValueError("STT pricing not configured")

        increments = (audio_duration_ms + 14_999) // 15_000
        return increments * price_row.cost

    async def calculate_tts_cost(self, character_count: int) -> float:
        pricing = await self._get_active_pricing("google_tts")
        price_row = next((p for p in pricing if p.pricing_type == "per_character"), None)

        if not price_row:
            raise ValueError("TTS pricing not configured")

        return character_count * price_row.cost

    async def log_api_call(
        self,
        user_id: UUID,
        provider: str,
        cost: float,
        api_endpoint: str = "",
        conversation_id: Optional[UUID] = None,
        request_tokens: Optional[int] = None,
        response_tokens: Optional[int] = None,
        total_tokens: Optional[int] = None,
        audio_duration_ms: Optional[int] = None,
        character_count: Optional[int] = None,
        status: str = "success",
    ) -> ApiCall:
        api_call = ApiCall(
            user_id=user_id,
            conversation_id=conversation_id,
            api_provider=provider,
            api_endpoint=api_endpoint,
            request_tokens=request_tokens,
            response_tokens=response_tokens,
            total_tokens=total_tokens,
            audio_duration_ms=audio_duration_ms,
            character_count=character_count,
            cost=cost,
            status=status,
        )
        self.db.add(api_call)
        await self.db.commit()
        await self.db.refresh(api_call)
        return api_call

    async def update_conversation_cost(self, conversation_id: UUID, additional_cost: float) -> None:
        conv = await self.db.get(Conversation, conversation_id)
        if conv:
            conv.total_cost += additional_cost
            self.db.add(conv)
            await self.db.commit()
