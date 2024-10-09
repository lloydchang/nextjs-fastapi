# File: app/api/chat/utils/validate.py

import os
from app.api.chat.utils.logger import logger

def validate_env_vars(vars: list[str]) -> bool:
    """
    Validates that all required environment variables are set and not placeholders.
    
    Args:
        vars (list): List of environment variable names to validate.
    
    Returns:
        bool: Returns True if all variables are valid, False otherwise.
    """
    are_valid = all(os.getenv(var_name) and 'your-' not in os.getenv(var_name, '') for var_name in vars)

    if not are_valid:
        logger.silly(f"app/api/chat/utils/validate.py - Validation failed for environment variables: {', '.join(vars)}")
    else:
        logger.debug(f"app/api/chat/utils/validate.py - Validated environment variables: {', '.join(vars)}")

    return are_valid
