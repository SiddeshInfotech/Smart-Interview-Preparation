"""
Docker and Piston API management utility.
Handles checking Docker status, managing the Piston container, and performing health checks.
"""

import logging
import subprocess
import time
from pathlib import Path
from typing import Tuple
import requests


def check_docker_running(logger: logging.Logger) -> bool:
    """
    Verify if the Docker daemon is active and responding.

    Args:
        logger (logging.Logger): Active logger instance.

    Returns:
        bool: True if Docker is running, False otherwise.
    """
    logger.info("Checking Docker service status...")
    try:
        result = subprocess.run(
            ["docker", "info"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            logger.info("Docker service is running.")
            return True
        else:
            logger.error(f"Docker daemon check failed: {result.stderr.strip()}")
            return False
    except FileNotFoundError:
        logger.error("Docker command not found. Please ensure Docker is installed and added to PATH.")
        return False
    except subprocess.TimeoutExpired:
        logger.error("Docker status check timed out. Is Docker responsive?")
        return False
    except Exception as exc:
        logger.error(f"Unexpected error checking Docker: {exc}")
        return False


def get_container_status(container_name: str) -> Tuple[bool, str]:
    """
    Inspect container status using docker inspect.

    Args:
        container_name (str): Name of the container to inspect.

    Returns:
        Tuple[bool, str]: (exists, status) e.g., (True, "running"), (True, "exited"), (False, "")
    """
    try:
        result = subprocess.run(
            ["docker", "inspect", "-f", "{{.State.Status}}", container_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            status = result.stdout.strip()
            return True, status
        return False, ""
    except Exception:
        return False, ""


def ensure_piston_container(container_name: str, automation_dir: Path, logger: logging.Logger) -> bool:
    """
    Ensure the Piston API container is running.
    Starts the container if stopped, or runs docker compose up -d if container doesn't exist.

    Args:
        container_name (str): Name of the Piston container.
        automation_dir (Path): Base automation directory.
        logger (logging.Logger): Active logger instance.

    Returns:
        bool: True if Piston container is running, False otherwise.
    """
    logger.info(f"Checking Piston container '{container_name}'...")
    exists, status = get_container_status(container_name)

    if exists:
        if status == "running":
            logger.info(f"Container '{container_name}' is already running.")
            return True
        else:
            logger.info(f"Container '{container_name}' exists (status: {status}). Starting container...")
            try:
                result = subprocess.run(
                    ["docker", "start", container_name],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=15
                )
                if result.returncode == 0:
                    logger.info(f"Container '{container_name}' started successfully.")
                    return True
                else:
                    logger.error(f"Failed to start container '{container_name}': {result.stderr.strip()}")
                    return False
            except Exception as exc:
                logger.error(f"Error starting container '{container_name}': {exc}")
                return False
    else:
        logger.warning(f"Container '{container_name}' not found. Attempting to start via docker-compose...")
        piston_compose_file = automation_dir.parent / "piston-server" / "docker-compose.yaml"
        
        if piston_compose_file.exists():
            try:
                cmd = ["docker", "compose", "-f", str(piston_compose_file), "up", "-d"]
                logger.info(f"Executing command: {' '.join(cmd)}")
                result = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=60
                )
                if result.returncode == 0:
                    logger.info(f"Docker Compose started Piston container successfully.")
                    return True
                else:
                    logger.error(f"Docker compose failed: {result.stderr.strip()}")
                    return False
            except Exception as exc:
                logger.error(f"Exception running docker compose: {exc}")
                return False
        else:
            logger.error(f"Could not find compose file at '{piston_compose_file}'. Please start Piston manually.")
            return False


def wait_for_piston(base_url: str, health_path: str, max_retries: int, retry_interval: int, logger: logging.Logger) -> bool:
    """
    Poll the Piston health endpoint until it responds with HTTP 200 or max retries are exceeded.

    Args:
        base_url (str): Local Piston base URL (e.g. http://localhost:2000).
        health_path (str): Endpoint path for runtimes check (e.g. /api/v2/runtimes).
        max_retries (int): Maximum number of retry attempts.
        retry_interval (int): Seconds between retries.
        logger (logging.Logger): Active logger instance.

    Returns:
        bool: True if Piston API is healthy and reachable, False otherwise.
    """
    health_url = f"{base_url.rstrip('/')}{health_path}"
    logger.info(f"Waiting for Piston health check at {health_url}...")

    for attempt in range(1, max_retries + 1):
        logger.info(f"Checking Piston health (Attempt {attempt}/{max_retries})...")
        try:
            response = requests.get(health_url, timeout=5)
            if response.status_code == 200:
                logger.info(f"Piston API is healthy and ready! (HTTP {response.status_code})")
                return True
            else:
                logger.warning(f"Piston returned HTTP {response.status_code}: {response.text[:100]}")
        except requests.RequestException as exc:
            logger.debug(f"Piston health check request exception: {exc}")

        if attempt < max_retries:
            time.sleep(retry_interval)

    logger.error(f"Piston health check failed after {max_retries} retries.")
    return False
