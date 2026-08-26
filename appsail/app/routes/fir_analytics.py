"""
FIR Analytics API.

Exposes every analytic query used by the intelligence dashboard as a
whitelisted RPC dispatcher plus named REST endpoints. All queries execute
against the live PostgreSQL `fir_details` dataset (1,674,734 records).
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, HTTPException

from app.database.connection import get_db_connection

router = APIRouter()

# Whitelisted DB functions -> positional argument names
RPC_FUNCTIONS: Dict[str, List[str]] = {
    "fir_kpi_totals": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_by_year": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_by_district": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_by_crime_group": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_by_crime_head": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_by_month": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_by_year_district": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_by_year_crime_group": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_victim_demographics": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_victim_demographics_by_crime": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_accused_vs_arrested": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_top_units": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages", "p_limit"],
    "fir_by_complaint_mode": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_by_fir_stage": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_by_place": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_district_deep_dive": ["p_district", "p_years", "p_crime_groups", "p_fir_stages"],
    "fir_yearly_trend": ["p_years", "p_districts", "p_crime_groups", "p_fir_stages"],
    "fir_filter_options": [],
    "fir_geo_districts": [],
    "fir_geo_beats": [],
    "fir_recent_cases": ["p_district", "p_unit", "p_limit"],
}


def _rows_to_dicts(rows) -> List[Dict[str, Any]]:
    return [dict(r) for r in rows]


from fastapi import Request
import json

@router.post("/rpc/{fn_name}")
async def dispatch_rpc(fn_name: str, request: Request):
    """
    Generic Supabase-compatible RPC bridge.
    Example body: {"p_years": [2023, 2024], "p_limit": 25}
    """
    try:
        body_bytes = await request.body()
        params = json.loads(body_bytes) if body_bytes else {}
    except Exception:
        params = {}

    return await _execute_rpc(fn_name, params)

async def _execute_rpc(fn_name: str, params: Dict[str, Any]):
    if fn_name not in RPC_FUNCTIONS:
        raise HTTPException(status_code=404, detail=f"Unknown analytics function '{fn_name}'")

    arg_names = RPC_FUNCTIONS[fn_name]
    placeholders = ", ".join(f"${i+1}" for i in range(len(arg_names)))
    sql = f"SELECT * FROM {fn_name}({placeholders})"

    args = []
    for name in arg_names:
        val = params.get(name)
        if name == "p_limit":
            val = int(val) if val is not None else 25
        elif val == []:
            val = None
        elif isinstance(val, list):
            if name.endswith(("years",)):
                val = [int(v) for v in val]
            else:
                val = [str(v) for v in val]
        args.append(val)

    async with get_db_connection() as conn:
        try:
            rows = await conn.fetch(sql, *args)
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=str(e))

    result = _rows_to_dicts(rows)

    # Unwrap scalar/JSON-returning functions (single row, single column
    # named after the function itself) into the raw payload.
    if (
        len(result) == 1
        and len(result[0]) == 1
        and fn_name in result[0]
    ):
        val = result[0][fn_name]
        import json as _json
        if isinstance(val, str):
            try:
                val = _json.loads(val)
            except ValueError:
                pass
        return val

    return result


# ------------------------------------------------------------
# Convenience REST wrappers
# ------------------------------------------------------------

@router.get("/filter-options")
async def filter_options():
    return await dispatch_rpc("fir_filter_options", {})


@router.get("/kpi")
async def kpi_totals():
    return (await dispatch_rpc("fir_kpi_totals", {}))[0]


@router.get("/geo/districts")
async def geo_districts():
    return await dispatch_rpc("fir_geo_districts", {})


@router.get("/geo/beats")
async def geo_beats():
    return await dispatch_rpc("fir_geo_beats", {})


@router.get("/stations")
async def stations(
    district: Optional[str] = None,
    limit: int = 30,
):
    return await dispatch_rpc("fir_top_units", {
        "p_districts": [district] if district else None,
        "p_limit": limit,
    })


@router.get("/recent")
async def recent(district: str, unit: str, limit: int = 50):
    return await dispatch_rpc("fir_recent_cases", {
        "p_district": district, "p_unit": unit, "p_limit": limit,
    })
