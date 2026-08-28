from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import asyncio

from app.database.connection import get_db_connection

router = APIRouter()

class CallEvent(BaseModel):
    call_reference_id: str
    emergency_number: str
    call_status: str
    priority: str
    call_time: datetime
    location: Optional[str] = None
    caller_reference: Optional[str] = None

class AcknowledgeRequest(BaseModel):
    acknowledged_by: str

class AssignRequest(BaseModel):
    assigned_officer: str
    assigned_by: str

@router.post("/call-event")
async def receive_call_event(event: CallEvent):
    async with get_db_connection() as conn:
        query = """
        INSERT INTO emergency_call_alerts (
            call_reference_id, emergency_number, call_status, priority, 
            caller_reference, location, call_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, call_reference_id, call_status, priority, created_at
        """
        try:
            row = await conn.fetchrow(
                query, 
                event.call_reference_id, event.emergency_number, event.call_status,
                event.priority, event.caller_reference, event.location, event.call_time
            )
            return {"status": "success", "alert": dict(row)}
        except Exception as e:
            # Handle unique violation
            if "unique constraint" in str(e).lower():
                raise HTTPException(status_code=400, detail="Call reference ID already exists")
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
async def get_alerts(limit: int = 50, offset: int = 0, status: Optional[str] = None):
    async with get_db_connection() as conn:
        if status:
            query = "SELECT * FROM emergency_call_alerts WHERE call_status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
            rows = await conn.fetch(query, status, limit, offset)
        else:
            query = "SELECT * FROM emergency_call_alerts ORDER BY created_at DESC LIMIT $1 OFFSET $2"
            rows = await conn.fetch(query, limit, offset)
        return [dict(r) for r in rows]

@router.get("/alerts/{alert_id}")
async def get_alert(alert_id: int):
    async with get_db_connection() as conn:
        row = await conn.fetchrow("SELECT * FROM emergency_call_alerts WHERE id = $1", alert_id)
        if not row:
            raise HTTPException(status_code=404, detail="Alert not found")
        return dict(row)

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, req: AcknowledgeRequest):
    async with get_db_connection() as conn:
        query = """
        UPDATE emergency_call_alerts 
        SET acknowledged = TRUE, acknowledged_by = $1, acknowledged_at = NOW(), updated_at = NOW()
        WHERE id = $2 RETURNING *
        """
        row = await conn.fetchrow(query, req.acknowledged_by, alert_id)
        if not row:
            raise HTTPException(status_code=404, detail="Alert not found")
        return dict(row)

@router.post("/alerts/{alert_id}/assign")
async def assign_alert(alert_id: int, req: AssignRequest):
    async with get_db_connection() as conn:
        query = "UPDATE emergency_call_alerts SET assigned_officer = $1, updated_at = NOW() WHERE id = $2 RETURNING *"
        row = await conn.fetchrow(query, req.assigned_officer, alert_id)
        if not row:
            raise HTTPException(status_code=404, detail="Alert not found")
        return dict(row)

@router.get("/summary")
async def get_summary():
    async with get_db_connection() as conn:
        critical = await conn.fetchval("SELECT COUNT(*) FROM emergency_call_alerts WHERE priority = 'CRITICAL'")
        unacked = await conn.fetchval("SELECT COUNT(*) FROM emergency_call_alerts WHERE acknowledged = FALSE")
        acked = await conn.fetchval("SELECT COUNT(*) FROM emergency_call_alerts WHERE acknowledged = TRUE")
        today = await conn.fetchval("SELECT COUNT(*) FROM emergency_call_alerts WHERE DATE(created_at) = CURRENT_DATE")
        return {
            "critical_alerts": critical,
            "unacknowledged": unacked,
            "acknowledged": acked,
            "todays_calls": today
        }

@router.post("/test-call")
async def test_call(type: str = "missed_112"):
    import uuid
    ref_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"
    event = CallEvent(
        call_reference_id=ref_id,
        emergency_number="112" if "112" in type else "100",
        call_status="MISSED" if "missed" in type else "ANSWERED",
        priority="CRITICAL" if "missed" in type else "NORMAL",
        call_time=datetime.now(),
        location="12.9716, 77.5946" if "112" in type else None
    )
    return await receive_call_event(event)
