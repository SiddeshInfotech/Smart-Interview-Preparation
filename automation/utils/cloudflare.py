"""
Cloudflare Tunnel management utility.
Handles starting cloudflared process, regex capturing of trycloudflare URL, and process cleanup.
"""

import logging
import re
import subprocess
import time
from typing import Optional, Tuple


class CloudflareTunnel:
    """Manages the Cloudflared tunnel process lifecycle."""

    def __init__(self, command: str, target_url: str, logger: logging.Logger):
        """
        Initialize CloudflareTunnel instance.

        Args:
            command (str): Executable command for cloudflared (e.g. 'cloudflared').
            target_url (str): Local target URL (e.g. 'http://localhost:2000').
            logger (logging.Logger): Active logger instance.
        """
        self.command = command
        self.target_url = target_url
        self.logger = logger
        self.process: Optional[subprocess.Popen] = None
        self.tunnel_url: Optional[str] = None

    def start(self, timeout: int = 30) -> Optional[str]:
        """
        Start the Cloudflared tunnel process and extract the generated trycloudflare URL.

        Args:
            timeout (int): Maximum time in seconds to wait for URL discovery.

        Returns:
            Optional[str]: Extracted trycloudflare base URL (e.g. https://xxx.trycloudflare.com), or None on failure.
        """
        cmd = [self.command, "tunnel", "--url", self.target_url]
        self.logger.info(f"Starting Cloudflare tunnel: {' '.join(cmd)}")

        try:
            # cloudflared prints log output to stderr
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True
            )
        except FileNotFoundError:
            self.logger.error(
                f"Cloudflared binary '{self.command}' was not found in system PATH. "
                "Please install cloudflared or specify the full path in CLOUDFLARED_COMMAND in automation/.env."
            )
            return None
        except Exception as exc:
            self.logger.error(f"Failed to launch cloudflared process: {exc}")
            return None

        self.logger.info("Cloudflared process launched. Capturing tunnel URL...")
        start_time = time.time()
        url_regex = re.compile(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com")

        while time.time() - start_time < timeout:
            # Check if process crashed prematurely
            if self.process.poll() is not None:
                self.logger.error(f"Cloudflared process terminated unexpectedly with exit code {self.process.returncode}.")
                return None

            if self.process.stdout:
                line = self.process.stdout.readline()
                if line:
                    self.logger.debug(f"[cloudflared] {line.strip()}")
                    match = url_regex.search(line)
                    if match:
                        self.tunnel_url = match.group(0)
                        self.logger.info(f"Successfully captured Cloudflare Tunnel URL: {self.tunnel_url}")
                        return self.tunnel_url

            time.sleep(0.1)

        self.logger.error(f"Timed out after {timeout} seconds waiting for Cloudflare Tunnel URL.")
        self.stop()
        return None

    def stop(self) -> None:
        """Gracefully terminate the cloudflared process."""
        if self.process and self.process.poll() is None:
            self.logger.info("Terminating Cloudflared tunnel process...")
            try:
                self.process.terminate()
                try:
                    self.process.wait(timeout=5)
                    self.logger.info("Cloudflared process stopped cleanly.")
                except subprocess.TimeoutExpired:
                    self.logger.warning("Cloudflared process did not exit in 5 seconds. Killing process...")
                    self.process.kill()
                    self.process.wait()
                    self.logger.info("Cloudflared process killed.")
            except Exception as exc:
                self.logger.error(f"Error during cloudflared process cleanup: {exc}")
        self.process = None


def format_piston_api_url(base_url: str, suffix: str = "/api/v2/piston") -> str:
    """
    Format trycloudflare URL to include full Piston API path.

    Args:
        base_url (str): Base Cloudflare URL (e.g. https://xxx.trycloudflare.com).
        suffix (str): Path suffix to append.

    Returns:
        str: Combined full URL (e.g. https://xxx.trycloudflare.com/api/v2/piston).
    """
    cleaned_base = base_url.rstrip("/")
    cleaned_suffix = suffix if suffix.startswith("/") else f"/{suffix}"
    return f"{cleaned_base}{cleaned_suffix}"
