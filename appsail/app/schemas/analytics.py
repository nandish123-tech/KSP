from pydantic import BaseModel


class CrimeTrend(BaseModel):
    label: str
    value: int
