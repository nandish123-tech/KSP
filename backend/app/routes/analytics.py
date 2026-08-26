from fastapi import APIRouter

router = APIRouter()

@router.get("/metrics")
async def get_analytics_metrics():
    # FUTURE INTEGRATION: Link direct SQL queries here
    return {
        "monthlyTrend": [
            {"month": "Jan", "cases": 1200},
            {"month": "Feb", "cases": 1350},
            {"month": "Mar", "cases": 1100},
            {"month": "Apr", "cases": 1600},
            {"month": "May", "cases": 1450},
            {"month": "Jun", "cases": 1890}
        ],
        "crimeTypes": [
            {"type": "Theft/Burglary", "value": 40},
            {"type": "Cybercrime", "value": 25},
            {"type": "Assault", "value": 20},
            {"type": "Narcotics", "value": 15}
        ],
        "districtComparison": [
            {"district": "Bengaluru", "crimes": 5420},
            {"district": "Mysuru", "crimes": 2110},
            {"district": "Hubbali", "crimes": 1840},
            {"district": "Mangaluru", "crimes": 1430}
        ]
    }