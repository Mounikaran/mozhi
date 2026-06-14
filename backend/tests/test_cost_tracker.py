"""Unit tests for CostTracker service."""
import pytest
from unittest.mock import MagicMock
from uuid import uuid4
from app.services.cost_tracker import CostTracker
from app.models.api_pricing import ApiPricing


def _make_db_with_pricing(rows: list[ApiPricing]) -> MagicMock:
    db = MagicMock()
    db.exec.return_value.all.return_value = rows
    return db


def _pricing(provider: str, model: str, ptype: str, cost: float) -> ApiPricing:
    return ApiPricing(
        id=uuid4(),
        api_provider=provider,
        model_name=model,
        pricing_type=ptype,
        cost=cost,
        is_active=True,
    )


class TestGeminiCost:
    def test_basic_calculation(self):
        pricing = [
            _pricing("gemini", "gemini-1.5-flash", "per_token_input", 0.075e-6),
            _pricing("gemini", "gemini-1.5-flash", "per_token_output", 0.30e-6),
        ]
        tracker = CostTracker(_make_db_with_pricing(pricing))
        cost = tracker.calculate_gemini_cost(50, 30, "gemini-1.5-flash")
        expected = (50 * 0.075e-6) + (30 * 0.30e-6)
        assert abs(cost - expected) < 1e-12

    def test_missing_pricing_raises(self):
        tracker = CostTracker(_make_db_with_pricing([]))
        with pytest.raises(ValueError, match="Pricing not configured"):
            tracker.calculate_gemini_cost(100, 100, "unknown-model")


class TestSTTCost:
    def test_rounds_up_to_15sec(self):
        pricing = [_pricing("google_stt", "v2", "per_15sec", 0.0036)]
        tracker = CostTracker(_make_db_with_pricing(pricing))
        # 10 seconds should cost the same as 15 seconds (one increment)
        cost_10 = tracker.calculate_stt_cost(10_000)
        cost_15 = tracker.calculate_stt_cost(15_000)
        assert cost_10 == cost_15 == 0.0036

    def test_two_increments(self):
        pricing = [_pricing("google_stt", "v2", "per_15sec", 0.0036)]
        tracker = CostTracker(_make_db_with_pricing(pricing))
        cost = tracker.calculate_stt_cost(16_000)  # > 15s, rounds to 2 increments
        assert abs(cost - 0.0072) < 1e-9


class TestTTSCost:
    def test_character_cost(self):
        pricing = [_pricing("google_tts", "neural", "per_character", 0.000016)]
        tracker = CostTracker(_make_db_with_pricing(pricing))
        cost = tracker.calculate_tts_cost(1000)
        assert abs(cost - 0.016) < 1e-9
