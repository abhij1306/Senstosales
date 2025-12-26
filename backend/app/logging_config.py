"""
Structured Logging Configuration
Provides app, business, and voice logging layers
"""

import logging
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any

# Create logs directory
LOGS_DIR = Path(__file__).parent.parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)


# Custom JSON formatter
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "module": record.module,
            "message": record.getMessage(),
        }

        # Add extra fields if present
        if hasattr(record, "action"):
            log_data["action"] = record.action
        if hasattr(record, "entity"):
            log_data["entity"] = record.entity
        if hasattr(record, "entity_id"):
            log_data["entity_id"] = record.entity_id
        if hasattr(record, "metadata"):
            log_data["metadata"] = record.metadata
        if hasattr(record, "status"):
            log_data["status"] = record.status

        return json.dumps(log_data)


# Application logger
app_logger = logging.getLogger("app")
app_logger.setLevel(logging.INFO)
app_handler = logging.FileHandler(LOGS_DIR / "app.log")
app_handler.setFormatter(JSONFormatter())
app_logger.addHandler(app_handler)

# Business logger
business_logger = logging.getLogger("business")
business_logger.setLevel(logging.INFO)
business_handler = logging.FileHandler(LOGS_DIR / "business.log")
business_handler.setFormatter(JSONFormatter())
business_logger.addHandler(business_handler)

# Voice logger (Phase 3)
voice_logger = logging.getLogger("voice")
voice_logger.setLevel(logging.INFO)
voice_handler = logging.FileHandler(LOGS_DIR / "voice.log")
voice_handler.setFormatter(JSONFormatter())
voice_logger.addHandler(voice_handler)


def log_business_event(
    action: str,
    entity: str,
    entity_id: str,
    status: str = "SUCCESS",
    metadata: Optional[Dict[str, Any]] = None,
):
    """Log a business event"""
    business_logger.info(
        f"{action} {entity} {entity_id}",
        extra={
            "action": action,
            "entity": entity,
            "entity_id": entity_id,
            "status": status,
            "metadata": metadata or {},
        },
    )


def log_api_request(method: str, path: str, status_code: int, duration_ms: float):
    """Log an API request"""
    app_logger.info(
        f"{method} {path} - {status_code}",
        extra={
            "action": "API_REQUEST",
            "metadata": {
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
            },
        },
    )
