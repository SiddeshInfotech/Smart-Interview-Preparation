"""
Main Automation Script for Smart Interview Preparation Piston & Render Sync.

Automates:
1. Docker daemon status verification.
2. Piston container initialization.
3. Local Piston API health checks.
4. Cloudflare tunnel initialization & public URL regex extraction.
5. Updating Render service environment variable (PISTON_API_URL).
6. Triggering a fresh Render deployment.
7. Graceful process cleanup and execution logging.
"""

import signal
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

# Ensure automation root directory is in sys.path for relative imports
AUTOMATION_ROOT = Path(__file__).resolve().parent
if str(AUTOMATION_ROOT) not in sys.path:
    sys.path.insert(0, str(AUTOMATION_ROOT))

from utils.config import load_config
from utils.logger import setup_logger, print_banner
from utils.docker import check_docker_running, ensure_piston_container, wait_for_piston
from utils.cloudflare import CloudflareTunnel, format_piston_api_url
from utils.render_api import RenderClient, RenderAPIError


tunnel_instance: Optional[CloudflareTunnel] = None


def cleanup_processes() -> None:
    """Stop active Cloudflare background tunnel processes on exit."""
    global tunnel_instance
    if tunnel_instance:
        tunnel_instance.stop()
        tunnel_instance = None


def signal_handler(sig, frame):
    """Handle interrupt signals (Ctrl+C, SIGINT, SIGTERM) gracefully."""
    print("\n[!] Shutdown signal received. Cleaning up processes...")
    cleanup_processes()
    print("[+] Cleanup complete. Exiting.")
    sys.exit(0)


def main() -> None:
    """Main execution flow for automation script."""
    global tunnel_instance

    # Register signal handlers for clean exit
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    start_timestamp = time.time()
    start_datetime = datetime.now()

    # Load Config and Initialize Logger
    config = load_config()
    logger = setup_logger(config.logs_dir)

    logger.info(f"Automation execution started at {start_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
    print_banner("Starting Smart Interview Backend Automation")

    try:
        # Step 1: Check Docker Daemon
        logger.info("Step 1/6: Checking Docker Daemon...")
        if not check_docker_running(logger):
            logger.critical("Docker is not running. Please start Docker Desktop and try again.")
            sys.exit(1)

        # Step 2: Ensure Piston Container is Running
        logger.info("Step 2/6: Checking Piston API container...")
        if not ensure_piston_container(config.piston_container_name, config.automation_dir, logger):
            logger.critical("Failed to start or locate Piston container.")
            sys.exit(1)

        # Step 3: Wait for Piston API Health Check
        logger.info("Step 3/6: Waiting for Piston health check...")
        if not wait_for_piston(
            base_url=config.local_piston_url,
            health_path=config.health_check_path,
            max_retries=config.max_retries,
            retry_interval=config.retry_interval,
            logger=logger
        ):
            logger.critical("Piston API failed health check.")
            sys.exit(1)

        # Step 4: Launch Cloudflare Tunnel & Extract URL
        logger.info("Step 4/6: Launching Cloudflare Tunnel...")
        tunnel = CloudflareTunnel(
            command=config.cloudflared_command,
            target_url=config.local_piston_url,
            logger=logger
        )
        tunnel_instance = tunnel

        tunnel_url = tunnel.start(timeout=30)
        if not tunnel_url:
            logger.critical("Could not obtain Cloudflare Tunnel URL.")
            cleanup_processes()
            sys.exit(1)

        full_piston_url = format_piston_api_url(tunnel_url, config.piston_endpoint_suffix)
        logger.info(f"Generated Piston API Endpoint: {full_piston_url}")

        # Step 5: Update Render Environment Variable
        logger.info("Step 5/6: Updating Render Environment Variable...")
        render_client = RenderClient(
            api_key=config.render_api_key,
            service_id=config.render_service_id,
            logger=logger
        )

        try:
            render_client.update_environment_variable(config.render_env_var_key, full_piston_url)
        except RenderAPIError as exc:
            logger.error(f"Failed to update Render environment variable: {exc}")
            logger.warning("Please verify RENDER_API_KEY and RENDER_SERVICE_ID in automation/.env")
            cleanup_processes()
            sys.exit(1)

        # Step 6: Trigger Render Deployment
        logger.info("Step 6/6: Triggering Render redeployment...")
        try:
            deploy_resp = render_client.trigger_deployment()
            deploy_id = deploy_resp.get("id") or deploy_resp.get("deploy", {}).get("id", "N/A")
            logger.info(f"Render redeployment triggered successfully (Deploy ID: {deploy_id}).")
        except RenderAPIError as exc:
            logger.error(f"Failed to trigger Render deployment: {exc}")
            cleanup_processes()
            sys.exit(1)

        elapsed_seconds = round(time.time() - start_timestamp, 2)
        logger.info(f"Automation sequence completed in {elapsed_seconds} seconds.")

        print_banner("Automation Completed Successfully!")
        print(f"[*] Cloudflare Tunnel URL: {full_piston_url}")
        print(f"[*] Render Service ID   : {config.render_service_id}")
        print(f"[*] Render Deploy ID   : {deploy_id}")
        print("\n[+] Cloudflare tunnel is running. Keep this window open.")
        print("[+] Press Ctrl+C at any time to stop the tunnel and exit.\n")

        # Keep process alive while tunnel runs
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[!] User interrupted script (Ctrl+C).")
    except Exception as exc:
        logger.exception(f"Unhandled exception in automation execution: {exc}")
    finally:
        cleanup_processes()
        logger.info("Automation session finished.")


if __name__ == "__main__":
    main()
