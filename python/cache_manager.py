# python/cache_manager.py

import pickle
import os
from typing import Any, Optional
from python.logger import logger  # Import the centralized logger

def load_cache(cache_file_path: str) -> Optional[Any]:
    """
    Loads data from a cache file if it exists.

    Args:
        cache_file_path (str): Path to the cache file.

    Returns:
        Optional[Any]: Loaded data or None if loading fails.
    """
    if os.path.exists(cache_file_path):
        logger.info(f"Loading cached data from {cache_file_path}.")
        try:
            with open(cache_file_path, 'rb') as cache_file:
                data = pickle.load(cache_file)
            logger.info(f"Cached data loaded successfully from {cache_file_path}.")
            return data
        except Exception as e:
            logger.error(f"Error loading cache from {cache_file_path}: {e}")
            return None
    else:
        logger.info(f"Cache file {cache_file_path} does not exist.")
        return None

def save_cache(data: Any, cache_file_path: str) -> None:
    """
    Saves data to a cache file.

    Args:
        data (Any): Data to be cached.
        cache_file_path (str): Path to the cache file.
    """
    logger.info(f"Saving data to cache file {cache_file_path}.")
    try:
        with open(cache_file_path, 'wb') as cache_file:
            pickle.dump(data, cache_file)
        logger.info(f"Data cached successfully at {cache_file_path}.")
    except Exception as e:
        logger.error(f"Error saving cache to {cache_file_path}: {e}")
