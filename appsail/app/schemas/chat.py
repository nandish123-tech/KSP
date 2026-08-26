from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    id: str
    role: str
    text: str
    timestamp: str
    cardType: Optional[str] = None
    cardData: Optional[Dict[str, Any]] = None

class ChatSessionRequest(BaseModel):
    title: str

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    pinned: bool