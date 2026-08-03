"""
Configuration manager for the automation module.
Loads settings from automation/.env file and provides typed access to all settings.
"""

import os
from pathlib import Path
from typing import NamedTuple
from dotenv import load_dotenv

# Locate automation root directory
AUTOMATION_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = AUTOMATION_DIR / ".env"

# Load environment variables from automation/.env
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()


class AppConfig(NamedTuple):
    """Immutable application settings container."""

    render_api_key: str
    render_service_id: str
    piston_container_name: str
    local_piston_url: str
    cloudflared_command: str
    max_retries: int
    retry_interval: int
    health_check_path: str
    piston_endpoint_suffix: str
    render_env_var_key: str
    automation_dir: Path
    logs_dir: Path


def load_config() -> AppConfig:
    """
    Load and parse configuration parameters from environment.

    Returns:
        AppConfig: Parsed configuration object.
    """
    automation_dir = AUTOMATION_DIR
    logs_dir = automation_dir / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    render_api_key = os.getenv("RENDER_API_KEY", "").strip()
    render_service_id = os.getenv("RENDER_SERVICE_ID", "").strip()
    piston_container_name = os.getenv("PISTON_CONTAINER_NAME", "piston_api").strip()
    local_piston_url = os.getenv("LOCAL_PISTON_URL", "http://localhost:2000").rstrip("/")
    cloudflared_command = os.getenv("CLOUDFLARED_COMMAND", "cloudflared").strip()

    try:
        max_retries = int(os.getenv("MAX_RETRIES", "10"))
    except ValueError:
        max_retries = 10

    try:
        retry_interval = int(os.getenv("RETRY_INTERVAL", "3"))
    except ValueError:
        retry_interval = 3

    return AppConfig(
        render_api_key=render_api_key,
        render_service_id=render_service_id,
        piston_container_name=piston_container_name,
        local_piston_url=local_piston_url,
        cloudflared_command=cloudflared_command,
        max_retries=max_retries,
        retry_interval=retry_interval,
        health_check_path="/api/v2/runtimes",
        piston_endpoint_suffix="/api/v2/piston",
        render_env_var_key="PISTON_API_URL",
        automation_dir=automation_dir,
        logs_dir=logs_dir,
    )
