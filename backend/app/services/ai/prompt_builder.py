import asyncpg
from typing import List

class PromptBuilder:
    def __init__(self):
        self.cached_schema = ""

    async def fetch_live_schema(self, connection: asyncpg.Connection) -> str:
        """
        Queries the database catalog to generate an exact 
        text representation of table architectures for the LLM context window.
        """
        if self.cached_schema:
            return self.cached_schema

        query = """
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        """
        rows = await connection.fetch(query)
        
        schema_dict = {}
        for row in rows:
            t_name = row['table_name']
            c_name = row['column_name']
            d_type = row['data_type']
            if t_name not in schema_dict:
                schema_dict[t_name] = []
            schema_dict[t_name].append(f"{c_name} {d_type}")

        schema_text = "DATABASE SCHEMA DEFINITIONS:\n"
        for table, columns in schema_dict.items():
            schema_text += f"- Table '{table}' columns: ({', '.join(columns)})\n"
            
        self.cached_schema = schema_text
        return self.cached_schema

    def build_system_context(self, schema_metadata: str, role: str) -> str:
        """Assembles the final structured prompt containing system safety guardrails."""
        return f"""
        You are an expert AI data investigator for the Karnataka State Police.
        Your sole task is to translate natural language into valid, executable PostgreSQL queries based on the schema provided below.
        
        {schema_metadata}
        
        CRITICAL RULES:
        1. Only return the raw SQL string inside a standard JSON format. Do not surround with markdown blocks like ```sql.
        2. Read-only clearance: Only generate SELECT queries.
        3. User clearance role: {role}. If the query attempts to access unauthorized information, return an empty string.
        """