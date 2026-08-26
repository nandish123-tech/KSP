from fastapi import APIRouter

router = APIRouter()

@router.get("/graph")
async def get_network_graph():
    # FUTURE INTEGRATION: Fetch nodes and edges from Neo4j or Postgres graph schemas
    return {
        "nodes": [
            {"id": "n1", "label": "Anand Hegde", "type": "Criminal", "risk": "High"},
            {"id": "n2", "label": "Suresh Shetty", "type": "Associate", "risk": "Medium"},
            {"id": "n3", "label": "KA-51-MJ-4112", "type": "Vehicle", "risk": "Low"},
            {"id": "n4", "label": "+91 98860 11223", "type": "Phone", "risk": "High"},
            {"id": "n5", "label": "Whitefield Safehouse", "type": "Location", "risk": "Critical"}
        ],
        "edges": [
            {"source": "n1", "target": "n2", "label": "Co-accused"},
            {"source": "n1", "target": "n3", "label": "Spotted driving"},
            {"source": "n2", "target": "n4", "label": "Registered SIM"},
            {"source": "n1", "target": "n5", "label": "Frequent Ping Location"}
        ]
    }