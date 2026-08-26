from fastapi import APIRouter, HTTPException
from app.schemas.chat import ChatMessage
from app.services.ai.gemini_service import GeminiService

import uuid
from datetime import datetime

router = APIRouter()

gemini = GeminiService()


@router.post("/query", response_model=ChatMessage)
async def process_chat_query(message: ChatMessage):

    try:

        result = await gemini.process_officer_query(
            message.text,
            "Inspector"
        )

        return ChatMessage(
            id=result["id"],
            role=result["role"],
            text=result["text"],
            timestamp=result["timestamp"],
            cardType=result["cardType"],
            cardData=result["cardData"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )