# File: backend/fastapi/utils/logger.py

import logging
import sys
from colorlog import ColoredFormatter

# Define a custom log format that includes colorized log levels
log_format = "%(asctime)s - %(filename)s:%(lineno)d - %(log_color)s%(levelname)s%(reset)s - %(message)s"

# Create a ColoredFormatter using the default log level colors from colorlog
formatter = ColoredFormatter(
    log_format,
    datefmt="%Y-%m-%d %H:%M:%S,%f",
    reset=True,
    style='%'
)

# Set up the console handler with the formatter
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)

# Create and configure the main logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.addHandler(console_handler)

# Test log messages using default levels and colors
# logger.critical("This is a critical message.")
# logger.error("This is an error message.")
# logger.warning("This is a warning message.")
# logger.info("This is an info message.")
# logger.debug("This is a debug message.")
