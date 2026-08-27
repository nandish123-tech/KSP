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

        FIR queries should use fir_details_2023.
        """

        prompt = f"""
You are an expert PostgreSQL SQL Generator for the Karnataka State Police Crime Intelligence System.

DATABASE SCHEMA:
{schema}

============================================================
IMPORTANT TABLE SELECTION RULE
============================================================

The database may contain multiple FIR-related tables.

For ALL FIR-related queries, crime analytics queries,
dashboard queries, crime statistics, district analysis,
year analysis, victim analysis, accused analysis,
crime type analysis, FIR searches, FIR counts,
FIR trends, FIR reports, and FIR aggregations:

ALWAYS use:

"fir_details_2023"

DO NOT use:

"fir_details"

unless the user explicitly asks for the original/full
"fir_details" table.

The table "fir_details_2023" contains the dataset that
should normally be used by this application.

Examples:

Correct:

SELECT COUNT(*)
FROM "fir_details_2023";

Correct:

SELECT COUNT(*)
FROM "fir_details_2023"
WHERE "FIR_YEAR" BETWEEN 2022 AND 2023;

Correct:

SELECT "District_Name", COUNT(*) AS total
FROM "fir_details_2023"
GROUP BY "District_Name"
ORDER BY total DESC;

Incorrect for normal FIR analytics:

SELECT COUNT(*)
FROM "fir_details";

============================================================
DATABASE RULES
============================================================

1. Generate ONLY PostgreSQL SQL.

2. Return ONLY ONE SQL query.

3. Never explain anything.

4. Never use markdown.

5. Only SELECT statements are allowed.

6. Never generate:
   INSERT
   UPDATE
   DELETE
   DROP
   ALTER
   CREATE
   TRUNCATE

7. Use ONLY tables and columns present in the provided schema.

8. If the question cannot be answered using the schema,
return exactly:

SELECT 'No matching data available' AS message;

============================================================
TABLE AND COLUMN NAMING
============================================================

The database contains mixed-case column names and
columns containing spaces.

ALWAYS copy table names EXACTLY as shown in the schema.

ALWAYS wrap EVERY table name in double quotes.

ALWAYS wrap EVERY column name in double quotes.

Never convert names to lowercase.

Never replace spaces with underscores.

Always preserve the exact spelling from the schema.

Examples:

Correct:

SELECT "District_Name"
FROM "fir_details_2023";

Correct:

SELECT "FIR_YEAR"
FROM "fir_details_2023";

Correct:

SELECT
    "Place of Offence",
    "Distance from PS",
    "FIR Type"
FROM "fir_details_2023";

Wrong:

SELECT District_Name FROM fir_details_2023;

Wrong:

SELECT FIR_YEAR FROM fir_details_2023;

Wrong:

SELECT "District_Name"
FROM fir_details;

============================================================
QUERY RULES
============================================================

For count questions use:

COUNT(*)

Example:

SELECT COUNT(*) AS total_count
FROM "fir_details_2023";

For grouped statistics use:

GROUP BY

Example:

SELECT
    "District_Name",
    COUNT(*) AS total_cases
FROM "fir_details_2023"
GROUP BY "District_Name"
ORDER BY total_cases DESC;

For top questions use:

ORDER BY ... DESC
LIMIT

For year-based questions use the FIR_YEAR column
when it exists in the schema.

Example:

SELECT
    "FIR_YEAR",
    COUNT(*) AS total_cases
FROM "fir_details_2023"
GROUP BY "FIR_YEAR"
ORDER BY "FIR_YEAR";

For district-based questions use the appropriate
district column exactly as defined in the schema.

For date ranges, use the appropriate date column
from the schema.

============================================================
LIMIT RULE
============================================================

For normal record-list queries:

Always include:

LIMIT 100

unless the user explicitly asks for all records.

IMPORTANT:

Do NOT add LIMIT to aggregate queries such as:

COUNT(*)
SUM()
AVG()
MIN()
MAX()
GROUP BY

unless a LIMIT is actually required by the question.

The database can contain hundreds of thousands of FIR
records, so never attempt to return the entire dataset
to the frontend.

Use aggregation for dashboard statistics.

============================================================
SECURITY
============================================================

Only generate SELECT statements.

Never generate:

INSERT
UPDATE
DELETE
DROP
ALTER
CREATE
TRUNCATE
GRANT
REVOKE

Never access system tables unless they are explicitly
provided in the schema and required.

Never execute multiple SQL statements.

Return exactly ONE SQL query.

============================================================
USER QUESTION
============================================================

{user_query}

============================================================
FINAL INSTRUCTION
============================================================

Return ONLY the PostgreSQL SQL query.

No explanation.
No markdown.
No comments.
No additional text.
"""

        response = self.client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )

        sql = response.text.strip()

        # Remove markdown fences if Gemini accidentally adds them
        sql = re.sub(r"^```sql\s*", "", sql, flags=re.IGNORECASE)
        sql = re.sub(r"^```\s*", "", sql)
        sql = re.sub(r"\s*```$", "", sql)

        return sql.strip()

    def fallback_heal_query(
        self,
        broken_sql: str,
        error_message: str
    ) -> str:
        """
        Attempts to repair invalid SQL using Gemini.
        """

        prompt = f"""
You are an expert PostgreSQL SQL repair assistant for the
Karnataka State Police Crime Intelligence System.

The following SQL produced an error.

BROKEN SQL:
{broken_sql}

DATABASE ERROR:
{error_message}

============================================================
REPAIR RULES
============================================================

1. Return ONLY ONE corrected PostgreSQL SQL query.

2. Only SELECT statements are allowed.

3. Never generate:
   INSERT
   UPDATE
   DELETE
   DROP
   ALTER
   CREATE
   TRUNCATE
   GRANT
   REVOKE

4. Preserve the original user's intent.

5. Use ONLY tables and columns available in the database schema.

6. Wrap every table name in double quotes.

7. Wrap every column name in double quotes.

8. Preserve the exact spelling and capitalization
   of table and column names.

============================================================
FIR TABLE RULE
============================================================

For normal FIR-related queries, use:

"fir_details_2023"

instead of:

"fir_details"

unless the original query explicitly requires the
original/full "fir_details" table.

============================================================
IMPORTANT
============================================================

Return ONLY SQL.

No markdown.
No explanation.
No comments.
No multiple statements.

============================================================
BROKEN SQL
============================================================

{broken_sql}

============================================================
ERROR
============================================================

{error_message}

============================================================
FINAL ANSWER
============================================================

Return ONLY the corrected SQL query.
"""

        response = self.client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )

        sql = response.text.strip()

        # Remove markdown fences
        sql = re.sub(r"^```sql\s*", "", sql, flags=re.IGNORECASE)
        sql = re.sub(r"^```\s*", "", sql)
        sql = re.sub(r"\s*```$", "", sql)

        return sql.strip()
