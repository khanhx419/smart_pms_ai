import re
from typing import Dict, Any, List

class SecurityScanner:
    """
    Implements security guardrails corresponding to Bandit / SAST scanning
    described in Section 3.5 & 5.4.5 (STRICT Mode Governance).
    """

    SECRET_PATTERNS = [
        (r'(?i)(api[_-]?key|secret|password|auth_token)\s*=\s*["\'][a-zA-Z0-9_\-]{8,}["\']', "Hardcoded API Key / Secret detected"),
        (r'(?i)jwt_secret\s*=\s*["\'][^"\']+["\']', "Hardcoded JWT Secret detected"),
        (r'(?i)SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*%s', "Potential SQL injection pattern"),
        (r'(?i)eval\s*\(', "Dangerous eval() function usage"),
    ]

    ARCHITECTURAL_RULES = [
        ("No direct database connection in frontend", lambda code, story_type: story_type == "FRONTEND" and ("db.connect" in code.lower() or "mysql" in code.lower())),
        ("Missing input validation", lambda code, story_type: story_type == "BACKEND" and "validate" not in code.lower() and "pydantic" not in code.lower() and "try" not in code.lower()),
    ]

    @classmethod
    def scan(cls, code: str, story_type: str, mode: str = "STRICT") -> Dict[str, Any]:
        if mode == "OFF":
            return {"passed": True, "issues": [], "mode": "OFF"}

        issues: List[str] = []

        # Check for hardcoded secrets
        for pattern, desc in cls.SECRET_PATTERNS:
            if re.search(pattern, code):
                issues.append(desc)

        # STRICT mode architectural compliance
        if mode == "STRICT":
            for rule_name, rule_fn in cls.ARCHITECTURAL_RULES:
                if rule_fn(code, story_type):
                    issues.append(f"Architectural compliance violation: {rule_name}")

        passed = len(issues) == 0
        return {
            "passed": passed,
            "issues": issues,
            "mode": mode,
            "scanner": "ScientificGuardrails-Bandit-SAST"
        }
