import os
import re
from google import genai
from app.config.settings import settings


class SQLGenerator:
    def __init__(self):
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

    def generate_query_string(self, user_query: str, schema: str) -> str:
        """
        Uses Gemini to dynamically generate PostgreSQL SQL
        from natural language based on the live database schema.
        """

        prompt = f"""
You are an expert PostgreSQL SQL Generator for the Karnataka State Police Crime Intelligence System.

DATABASE SCHEMA:
{schema}

IMPORTANT DATABASE RULES

1. Generate ONLY PostgreSQL SQL.
2. Return ONLY ONE SQL query.
3. Never explain anything.
4. Never use markdown.
5. Only SELECT statements are allowed.
6. Never generate INSERT, UPDATE, DELETE, DROP, ALTER, CREATE or TRUNCATE.
7. Use ONLY tables and columns present in the schema.
8. If the question cannot be answered, return exactly:

SELECT 'No matching data available' AS message;

-------------------------------------------------
VERY IMPORTANT
-------------------------------------------------

The database contains mixed-case column names and
columns containing spaces.

ALWAYS copy table names EXACTLY as shown.

ALWAYS wrap EVERY table name in double quotes.

ALWAYS wrap EVERY column name in double quotes.

Examples:

Correct:
SELECT "District_Name"
FROM "fir_details";

Correct:
SELECT "FIR_YEAR"
FROM "fir_details";

Correct:
SELECT
    "Place of Offence",
    "Distance from PS",
    "FIR Type"
FROM "fir_details";

Wrong:
SELECT District_Name FROM fir_details;

Wrong:
SELECT FIR_YEAR FROM fir_details;

Never convert names to lowercase.

Never replace spaces with underscores.

Always preserve the exact spelling from the schema.

-------------------------------------------------

For count questions use COUNT(*).

For top questions use ORDER BY ... DESC LIMIT.

Always include LIMIT 100 unless the user explicitly asks for all records.

Return ONLY SQL.

USER QUESTION:
{user_query}
"""

        response = self.client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )

        sql = response.text.strip()

        sql = re.sub(r"^```sql\s*", "", sql)
        sql = re.sub(r"^```", "", sql)
        sql = re.sub(r"```$", "", sql)

        return sql.strip()

    def fallback_heal_query(self, broken_sql: str, error_message: str) -> str:
        """
        Attempts to repair invalid SQL using Gemini.
        """

        prompt = f"""
You are an expert PostgreSQL SQL repair assistant.

The following SQL produced an error.

SQL:
{broken_sql}

Error:
{error_message}

Rules:

1. Return ONLY corrected SQL.
2. Preserve the original intent.
3. Use ONLY SELECT.
4. Wrap every table name in double quotes.
5. Wrap every column name in double quotes.
6. Preserve the exact column names from the schema.
7. Never use markdown.

Return ONLY SQL.
"""

        response = self.client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )

        sql = response.text.strip()

        sql = re.sub(r"^```sql\s*", "", sql)
        sql = re.sub(r"^```", "", sql)
        sql = re.sub(r"```$", "", sql)

        return sql.strip()