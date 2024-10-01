# api/sdg_manager.py

from typing import List, Dict
from api.logger import logger  # Import the logger

def get_sdg_keywords() -> Dict[str, List[str]]:
    """
    Retrieves the predefined list of SDG keywords for all 17 SDGs.

    Returns:
        Dict[str, List[str]]: Dictionary mapping SDG names to their keywords.
    """
    logger.info("Retrieving SDG keywords.")
    # Assuming sdg_keywords.py contains a dictionary named sdg_keywords
    from api.sdg_keywords import sdg_keywords
    return sdg_keywords
