import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "KSP Crime Intelligence Assistant"
    API_V1_STR = "/api/v1"

    DATABASE_URL = os.getenv("DATABASE_URL")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

settings = Settings()

print("DATABASE_URL:", settings.DATABASE_URL)
print("GEMINI_API_KEY Loaded:", settings.GEMINI_API_KEY is not None)