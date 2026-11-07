from decimal import Decimal
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./finpay.db"
    JWT_SECRET_KEY: str = "finpay_secret_key_change_me_in_env"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CORS_ORIGIN: str = "http://localhost:5173"
    DEMO_MODE: bool = True
    CASHBACK_PERCENTAGE: Decimal = Decimal("0.00")
    CASHBACK_MIN_AMOUNT: Decimal = Decimal("0.00")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGIN.split(",") if origin.strip()]


settings = Settings()
