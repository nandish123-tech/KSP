from typing import Dict, Any
from datetime import datetime


class ResponseFormatter:

    def compile_ui_payload(
        self,
        original_query: str,
        generated_sql: str,
        db_result: Dict[str, Any]
    ) -> Dict[str, Any]:

        timestamp = datetime.now().strftime("%I:%M %p")

        card_type = db_result.get("type", "text")

        # Default message
        summary = "Query executed successfully."

        if card_type == "table":

            row_count = len(db_result.get("rows", []))

            if row_count == 0:
                summary = "No matching records were found."

            elif row_count == 1:
                summary = "Found 1 matching record."

            else:
                summary = f"Found {row_count} matching records."

        elif card_type == "heatmap":

            summary = (
                f"Crime hotspot analysis completed. "
                f"{db_result.get('records_count',0)} incidents detected."
            )

        elif card_type == "network":

            summary = (
                f"Relationship analysis completed. "
                f"{len(db_result.get('rows',[]))} links identified."
            )

        elif card_type == "text":

            summary = db_result.get(
                "data",
                "No information available."
            )

        return {

            "id": f"ai-response-{datetime.now().timestamp()}",

            "role": "ai",

            "text": summary,

            "timestamp": timestamp,

            "cardType": card_type,

            "cardData": db_result,

            # Useful while debugging
            "generatedSQL": generated_sql

        }

    def format_security_violation(
        self,
        violation_message: str
    ) -> Dict[str, Any]:

        return {

            "id": f"security-error-{datetime.now().timestamp()}",

            "role": "ai",

            "text": violation_message,

            "timestamp": datetime.now().strftime("%I:%M %p"),

            "cardType": "text",

            "cardData": {}

        }