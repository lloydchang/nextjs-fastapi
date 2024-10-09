# File: app/api/chat/utils/logger.py

import logging
import os
import sys
from colorlog import ColoredFormatter

# Define custom log levels based on recommended priorities
SILLY_LEVEL_NUM = 5          # Lower than DEBUG (10)
VERBOSE_LEVEL_NUM = 15       # Between DEBUG (10) and INFO (20)
HTTP_LEVEL_NUM = 25          # Between INFO (20) and WARNING (30)

logging.addLevelName(SILLY_LEVEL_NUM, "SILLY")
logging.addLevelName(VERBOSE_LEVEL_NUM, "VERBOSE")
logging.addLevelName(HTTP_LEVEL_NUM, "HTTP")

# Define custom methods for log levels
def silly(self, message, *args, **kws):
    if self.isEnabledFor(SILLY_LEVEL_NUM):
        self._log(SILLY_LEVEL_NUM, message, args, **kws)

def verbose(self, message, *args, **kws):
    if self.isEnabledFor(VERBOSE_LEVEL_NUM):
        self._log(VERBOSE_LEVEL_NUM, message, args, **kws)

def http(self, message, *args, **kws):
    if self.isEnabledFor(HTTP_LEVEL_NUM):
        self._log(HTTP_LEVEL_NUM, message, args, **kws)

# Attach custom methods to Logger class
logging.Logger.silly = silly
logging.Logger.verbose = verbose
logging.Logger.http = http

# Define color mapping for custom levels and overrides
LOG_COLORS = {
    'SILLY': 'bold_magenta',
    'VERBOSE': 'bold_cyan',
    'HTTP': 'bold_green',
    'DEBUG': 'bold_blue',
}

# Create a centralized logger
logger = logging.getLogger('app_logger')

# Retrieve log level from environment variable
log_level_name = os.getenv("PYTHON_LOGGER_LEVEL", "DEBUG").upper()
log_level = getattr(logging, log_level_name, logging.DEBUG)
logger.setLevel(log_level)

# Use `colorlog`'s `ColoredFormatter` with the refined color scheme
formatter = ColoredFormatter(
    fmt="%(asctime)s - %(filename)s:%(lineno)d - %(log_color)s%(levelname)s%(reset)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    log_colors=LOG_COLORS,
    style='%'
)

# Create console handler and set its formatter
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(formatter)

# Add the handler to the logger if not already added
if not logger.handlers:
    logger.addHandler(console_handler)

# Prevent logging messages from being propagated to the root logger
logger.propagate = False

# Log an initialization message to confirm logger setup
logger.silly('Logger initialized successfully from app/api/chat/utils/logger.py')
