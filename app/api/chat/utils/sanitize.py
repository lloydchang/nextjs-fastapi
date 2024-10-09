# File: app/api/chat/utils/sanitize.py

import re
import logging

# Set up a logger
logger = logging.getLogger(__name__)

def sanitize_input(input: str) -> str:
    sanitized = re.sub(r"[`~!@#$%^&*()_|+\-=?;:'\",.<>\{\}\[\]\\\/]", '', input)
    # Uncomment the line below to enable logging
    # logger.debug(f"app/api/chat/utils/sanitize.py - Sanitized input: {sanitized}")
    return sanitized
