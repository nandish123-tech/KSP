import asyncpg
from typing import Dict, Any, List

class DBExecutor:
    async def execute_safely(self, connection: asyncpg.Connection, verified_sql: str) -> Dict[str, Any]:
        """
        Executes a verified SQL query string against the live PostgreSQL database instance
        and structures rows dynamically into headers and data payloads.
        """
        try:
            # Execute query fetch operation
            records = await connection.fetch(verified_sql)
            
            if not records:
                return {"type": "text", "data": "No matching records located within system parameters."}

            # Inspect record keys dynamically to generate component headers
            headers = list(records[0].keys())
            rows = [list(record.values()) for record in records]

            # Strategic decision matching: Determine best visual component layout map
            # If the output coordinates are fetched, route to a map preview component
            if "latitude" in headers and "longitude" in headers:
                return {
                    "type": "heatmap",
                    "center": [float(records[0]["latitude"]), float(records[0]["longitude"])],
                    "intensity": "CRITICAL REGION CLUSTER",
                    "records_count": len(rows),
                    "headers": headers,
                    "rows": [[str(val) for val in row] for row in rows]
                }

            # If node/edge structural links are identified, flag for graph canvas rendering
            if "source_id" in headers or "target_id" in headers:
                return {
                    "type": "network",
                    "headers": headers,
                    "rows": [[str(val) for val in row] for row in rows]
                }

            # Default tabular delivery mapping
            return {
                "type": "table",
                "headers": headers,
                "rows": [[str(val) for val in row] for row in rows]
            }

        except asyncpg.PostgresError as db_err:
            return {
                "type": "text",
                "data": f"Database processing exception error encountered: {str(db_err)}"
            }