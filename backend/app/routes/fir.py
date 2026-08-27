from fastapi import APIRouter, Request, HTTPException
from app.database.connection import get_db_connection

router = APIRouter()

@router.post("/rpc/{fn_name}")
async def rpc_endpoint(fn_name: str, request: Request):
    """
    Dynamic RPC endpoint that mimics Supabase's PostgREST rpc call.
    It calls PostgreSQL functions like fir_kpi_totals(p_years := $1, ...).
    """
    # Security: Only allow functions starting with fir_ to prevent arbitrary execution
    if not fn_name.startswith("fir_") or not fn_name.isidentifier():
        raise HTTPException(status_code=400, detail="Invalid function name")
        
    try:
        # Some requests might have empty body
        body_bytes = await request.body()
        body = await request.json() if body_bytes else {}
    except Exception:
        body = {}
        
    args = []
    arg_names = []
    
    for i, (key, value) in enumerate(body.items(), start=1):
        # Prevent SQL injection in parameter names
        if not key.isidentifier():
            raise HTTPException(status_code=400, detail="Invalid parameter name")
        arg_names.append(f"{key} := ${i}")
        args.append(value)
        
    query = f"SELECT * FROM {fn_name}({', '.join(arg_names)});"
    
    async with get_db_connection() as conn:
        try:
            rows = await conn.fetch(query, *args)
            result = [dict(row) for row in rows]
            
            # PostgREST unwrap logic:
            # If the RPC returns a single row with a single column containing a JSON string,
            # or if it's fir_filter_options returning the object directly, unwrap it.
            if fn_name == "fir_filter_options" and len(result) > 0:
                row = result[0]
                if len(row) == 1:
                    val = list(row.values())[0]
                    if isinstance(val, str) and val.startswith("{"):
                        import json
                        return json.loads(val)
                return row
                
            return result
        except Exception as e:
            print(f"Error executing RPC {fn_name}: {repr(e)}")
            raise HTTPException(status_code=500, detail=repr(e))
