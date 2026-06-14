"""Seed initial data: default admin user, API pricing, and API models."""
from sqlmodel import Session, select
from app.database import engine, create_db_and_tables
from app.models.user import User
from app.models.api_pricing import ApiPricing
from app.models.api_model import ApiModel
from app.utils.auth import hash_password
from app.config import get_settings

settings = get_settings()


def seed():
    create_db_and_tables()
    with Session(engine) as db:
        _seed_admin(db)
        _seed_pricing(db)
        _seed_models(db)
    print("Seed complete.")


def _seed_admin(db: Session):
    existing = db.exec(select(User).where(User.username == settings.admin_default_username)).first()
    if existing:
        return
    admin = User(
        email=f"{settings.admin_default_username}@localhost",
        username=settings.admin_default_username,
        password_hash=hash_password(settings.admin_default_password),
        is_admin=True,
    )
    db.add(admin)
    db.commit()
    print(f"Admin user '{settings.admin_default_username}' created.")


def _seed_pricing(db: Session):
    rows = [
        ApiPricing(api_provider="gemini", model_name="gemini-1.5-flash", pricing_type="per_token_input", cost=0.075 / 1_000_000, is_active=True),
        ApiPricing(api_provider="gemini", model_name="gemini-1.5-flash", pricing_type="per_token_output", cost=0.30 / 1_000_000, is_active=True),
        ApiPricing(api_provider="gemini", model_name="gemini-1.5-pro", pricing_type="per_token_input", cost=1.25 / 1_000_000, is_active=False),
        ApiPricing(api_provider="gemini", model_name="gemini-1.5-pro", pricing_type="per_token_output", cost=5.00 / 1_000_000, is_active=False),
        ApiPricing(api_provider="google_stt", model_name="v2", pricing_type="per_15sec", cost=0.0036, is_active=True),
        ApiPricing(api_provider="google_tts", model_name="neural", pricing_type="per_character", cost=0.000016, is_active=True),
        ApiPricing(api_provider="google_tts", model_name="standard", pricing_type="per_character", cost=0.000004, is_active=False),
    ]
    for row in rows:
        exists = db.exec(
            select(ApiPricing).where(
                ApiPricing.api_provider == row.api_provider,
                ApiPricing.model_name == row.model_name,
                ApiPricing.pricing_type == row.pricing_type,
            )
        ).first()
        if not exists:
            db.add(row)
    db.commit()
    print("API pricing seeded.")


def _seed_models(db: Session):
    rows = [
        ApiModel(api_provider="gemini", model_name="gemini-1.5-flash", model_version="1.0", endpoint_url="https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", is_active=True),
        ApiModel(api_provider="gemini", model_name="gemini-1.5-pro", model_version="1.0", endpoint_url="https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", is_active=False),
        ApiModel(api_provider="google_stt", model_name="v2", model_version="2.21", endpoint_url="speech.googleapis.com", is_active=True),
        ApiModel(api_provider="google_tts", model_name="neural", model_version="latest", endpoint_url="texttospeech.googleapis.com", is_active=True),
    ]
    for row in rows:
        exists = db.exec(
            select(ApiModel).where(
                ApiModel.api_provider == row.api_provider,
                ApiModel.model_name == row.model_name,
            )
        ).first()
        if not exists:
            db.add(row)
    db.commit()
    print("API models seeded.")


if __name__ == "__main__":
    seed()
