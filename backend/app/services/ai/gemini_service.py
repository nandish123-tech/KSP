from typing import Dict, Any

from app.database.connection import get_db_connection
from .prompt_builder import PromptBuilder
from .sql_generator import SQLGenerator
from .sql_validator import SQLValidator
from .db_executor import DBExecutor
from .response_formatter import ResponseFormatter


class GeminiService:

    def __init__(self):
        self.prompt_builder = PromptBuilder()
        self.sql_generator = SQLGenerator()
        self.sql_validator = SQLValidator()
        self.db_executor = DBExecutor()
        self.response_formatter = ResponseFormatter()

    async def process_officer_query(
        self,
        user_query: str,
        officer_role: str
    ) -> Dict[str, Any]:

        try:

            async with get_db_connection() as connection:

                print("Connected to database...")

                # Step 1: Read live schema
                schema_metadata = await self.prompt_builder.fetch_live_schema(
                    connection
                )

                print("Schema Loaded")

                # Step 2: Generate SQL
                generated_sql = self.sql_generator.generate_query_string(
                    user_query=user_query,
                    schema=schema_metadata
                )

                print("Generated SQL:")
                print(generated_sql)

                # Step 3: Validate SQL
                valid, message = self.sql_validator.validate_ast(
                    generated_sql,
                    officer_role
                )

                if not valid:
                    return self.response_formatter.format_security_violation(
                        message
                    )

                # Step 4: Execute SQL
                db_result = await self.db_executor.execute_safely(
                    connection,
                    generated_sql
                )

                print("Database Result:")
                print(db_result)

                # Step 5: Format Response
                return self.response_formatter.compile_ui_payload(
                    original_query=user_query,
                    generated_sql=generated_sql,
                    db_result=db_result
                )

        except Exception as e:

            import traceback
            traceback.print_exc()

            return self.response_formatter.format_security_violation(
                str(e)
            )