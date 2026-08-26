from typing import Tuple

class SQLValidator:
    def validate_ast(self, sql_string: str, role: str) -> Tuple[bool, str]:
        """
        Inspects query tokens to block SQL injection risks 
        and enforce strict Role-Based Access Control (RBAC).
        """
        normalized_sql = sql_string.upper()
        
        # Guardrail 1: Block Destructive Commands completely
        destructive_keywords = ["DROP", "DELETE", "TRUNCATE", "ALTER", "GRANT"]
        for keyword in destructive_keywords:
            if keyword in normalized_sql:
                return False, f"SECURITY AUDIT ERROR: Unauthorized destructive operation [{keyword}] intercepted."
        
        # Guardrail 2: Enforce Role Boundaries
        if role == "Constable":
            if "SUSPECTS" in normalized_sql or "PHONE" in normalized_sql:
                return False, "PRIVILEGE VIOLATION: Constables lack clearance to query PII suspect telemetry logs directly."
                
        return True, "Passed inspection verification thresholds successfully."