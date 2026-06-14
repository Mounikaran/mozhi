import asyncio
import json
from google import genai
from google.genai import types
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from uuid import UUID

from app.config import get_settings
from app.models.api_model import ApiModel
from app.services.cost_tracker import CostTracker

settings = get_settings()

COACHING_SYSTEM_PROMPT = """You are an expert English language coach for Tamil-speaking learners.
Your role is to:
1. Evaluate the user's English response for grammar, vocabulary, fluency, and pronunciation (based on transcribed text).
2. Provide specific, actionable feedback in Tamil (for clarity) and English.
3. Highlight strengths and areas for improvement.
4. Give a corrected version of their response if needed.
5. Suggest 2-3 alternative phrasings to enrich vocabulary.
6. Score the response on a scale of 1-10 for overall English proficiency.

Always be encouraging, supportive, and culturally sensitive.
Format your response as JSON with keys: feedback_tamil, feedback_english, corrected_response, alternatives, score, grammar_notes, vocabulary_notes."""


class GeminiService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = genai.Client(api_key=settings.gemini_api_key)

    async def _get_active_model_name(self) -> str:
        stmt = select(ApiModel).where(
            ApiModel.api_provider == "gemini",
            ApiModel.is_active == True,
        )
        record = (await self.db.exec(stmt)).first()
        return record.model_name if record else settings.gemini_model

    async def evaluate_response(
        self,
        user_id: UUID,
        transcription: str,
        topic: Optional[str] = None,
        conversation_id: Optional[UUID] = None,
    ) -> dict:
        model_name = await self._get_active_model_name()
        cost_tracker = CostTracker(self.db)

        prompt = f"""Topic: {topic or 'General English conversation'}
User's response (transcribed): {transcription}

Please evaluate this English response and provide structured feedback."""

        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=COACHING_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )

        usage = response.usage_metadata
        input_tokens = usage.prompt_token_count or 0
        output_tokens = usage.candidates_token_count or 0

        cost = await cost_tracker.calculate_gemini_cost(input_tokens, output_tokens, model_name)
        await cost_tracker.log_api_call(
            user_id=user_id,
            provider="gemini",
            cost=cost,
            api_endpoint=f"gemini/{model_name}",
            conversation_id=conversation_id,
            request_tokens=input_tokens,
            response_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
        )

        if conversation_id:
            await cost_tracker.update_conversation_cost(conversation_id, cost)

        try:
            feedback = json.loads(response.text)
        except (json.JSONDecodeError, AttributeError):
            feedback = {"raw_response": response.text or ""}

        feedback["model_used"] = model_name
        feedback["cost"] = cost
        return feedback
