from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_cases: int = 0
    active_alerts: int = 0
