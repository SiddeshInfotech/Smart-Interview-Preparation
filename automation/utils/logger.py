"""
Logger configuration utility for the automation workflow.
Provides colored console log formatting and daily file logging.
"""

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    import colorama
    colorama.init(autoreset=True)
    HAS_COLORAMA = True
except ImportError:
    HAS_COLORAMA = False

# ANSI Color Codes (fallback if colorama not available or for direct string styling)
COLOR_GREEN = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_RED = "\033[91m"
COLOR_CYAN = "\033[96m"
COLOR_BOLD = "\033[1m"
COLOR_RESET = "\033[0m"


class ColoredConsoleFormatter(logging.Formatter):
    """Custom logging formatter that adds ANSI colors to console output based on log levels."""

    LEVEL_COLORS = {
        logging.DEBUG: COLOR_CYAN,
        logging.INFO: COLOR_GREEN,
        logging.WARNING: COLOR_YELLOW,
        logging.ERROR: COLOR_RED,
        logging.CRITICAL: COLOR_RED + COLOR_BOLD,
    }

    def format(self, record: logging.LogRecord) -> str:
        log_message = super().format(record)
        if sys.stdout.isatty():
            color = self.LEVEL_COLORS.get(record.levelno, COLOR_RESET)
            return f"{color}{log_message}{COLOR_RESET}"
        return log_message


def setup_logger(logs_dir: Path, name: str = "automation") -> logging.Logger:
    """
    Initialize and return a configured logger instance.

    Args:
        logs_dir (Path): Directory where log files are written.
        name (str): Logger name identifier.

    Returns:
        logging.Logger: Configured logger.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    # Avoid duplicate handlers if setup_logger is called multiple times
    if logger.handlers:
        return logger

    # Daily Log File Handler (automation/logs/YYYY-MM-DD.log)
    today_str = datetime.now().strftime("%Y-%m-%d")
    log_file_path = logs_dir / f"{today_str}.log"

    file_formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(filename)s:%(lineno)d] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler = logging.FileHandler(log_file_path, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # Stream Handler (Console)
    console_formatter = ColoredConsoleFormatter("%(message)s")
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)

    return logger


def print_banner(text: str) -> None:
    """Print an eye-catching formatted section banner to stdout."""
    line = "=" * 50
    print(f"\n{COLOR_CYAN}{COLOR_BOLD}{line}")
    print(f" {text}")
    print(f"{line}{COLOR_RESET}\n")
