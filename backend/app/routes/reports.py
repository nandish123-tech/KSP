from fastapi import APIRouter
from app.schemas.reports import ReportListResponse

router = APIRouter()

@router.get("/list")
async def get_reports():
    return [
        {"id": "REP-001", "title": "Cyber Extortion Ring Analysis", "date": "2026-07-01", "author": "Inspector Patil", "district": "Bengaluru", "status": "Approved"},
        {"id": "REP-002", "title": "Mysuru Highway Robbery Pattern", "date": "2026-06-24", "author": "Sub Inspector Gowda", "district": "Mysuru", "status": "Pending Review"},
        {"id": "REP-003", "title": "Belagavi Narcotics Distribution Network", "date": "2026-06-15", "author": "Inspector Patil", "district": "Belagavi", "status": "Archived"}
    ]