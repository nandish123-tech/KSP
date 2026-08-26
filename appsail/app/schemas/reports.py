from pydantic import BaseModel
from typing import List

class ReportItem(BaseModel):
    id: str
    title: str
    date: str
    author: str
    district: str
    status: str

class ReportListResponse(BaseModel):
    reports: List[ReportItem]