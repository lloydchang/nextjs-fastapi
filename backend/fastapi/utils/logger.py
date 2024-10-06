# File: backend.fastapi/utils/logger.py

import logging
import sys

# Configure logging to include filename and line number
logging.basicConfig(
    level=logging.INFO,  # Change to DEBUG for more detailed logs
    format="%(asctime)s - %(filename)s:%(lineno)d - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Create a logger instance
logger = logging.getLogger(__name__)
