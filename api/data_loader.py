# api/data_loader.py

import pandas as pd
import pickle
import os
from api.logger import logger  # Import the logger

def load_dataset(file_path: str, cache_file_path: str) -> pd.DataFrame:
    """
    Loads the TEDx dataset with caching.

    Args:
        file_path (str): Path to the CSV file.
        cache_file_path (str): Path to the cache file.

    Returns:
        pd.DataFrame: Loaded dataset.
    """
    logger.info("Loading the TEDx Dataset with a caching mechanism.")
    data = pd.DataFrame()

    if os.path.exists(cache_file_path):
        logger.info("Loading cached dataset.")
        try:
            with open(cache_file_path, 'rb') as cache_file:
                data = pickle.load(cache_file)
            logger.info(f"Cached dataset loaded successfully with {len(data)} records.")
        except Exception as e:
            logger.error(f"Error loading cached dataset: {e}")
    else:
        logger.info("Loading dataset from CSV file.")
        try:
            data = pd.read_csv(file_path)
            logger.info(f"Dataset successfully loaded with {len(data)} records.")
            # Cache the dataset for future use
            with open(cache_file_path, 'wb') as cache_file:
                pickle.dump(data, cache_file)
            logger.info("Dataset cached successfully.")
        except Exception as e:
            logger.error(f"Error loading dataset: {e}")

    return data
