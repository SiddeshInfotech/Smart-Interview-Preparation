"""
Render API Integration Utility.
Provides methods to update service environment variables and trigger deploys via Render REST API v1.
"""

import logging
from typing import Dict, Any, Optional
import requests

RENDER_API_BASE_URL = "https://api.render.com/v1"


class RenderAPIError(Exception):
    """Custom exception raised when Render API requests fail."""
    pass


class RenderClient:
    """Client for interacting with the Render REST API."""

    def __init__(self, api_key: str, service_id: str, logger: logging.Logger):
        """
        Initialize RenderClient.

        Args:
            api_key (str): Render API Key.
            service_id (str): Target Render Service ID.
            logger (logging.Logger): Active logger instance.
        """
        self.api_key = api_key
        self.service_id = service_id
        self.logger = logger
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _validate_credentials(self) -> None:
        """Validate that API Key and Service ID are present."""
        if not self.api_key or self.api_key.startswith("rnd_xxxx"):
            raise RenderAPIError(
                "Invalid or missing RENDER_API_KEY. Please set a valid Render API Key in automation/.env"
            )
        if not self.service_id or self.service_id.startswith("srv-xxxx"):
            raise RenderAPIError(
                "Invalid or missing RENDER_SERVICE_ID. Please set a valid Render Service ID in automation/.env"
            )

    def update_environment_variable(self, key: str, value: str) -> bool:
        """
        Update or add an environment variable for the Render service.

        Args:
            key (str): Environment variable key name (e.g. PISTON_API_URL).
            value (str): New environment variable value.

        Returns:
            bool: True if environment variable was updated successfully.

        Raises:
            RenderAPIError: If the API request fails or returns an error status code.
        """
        self._validate_credentials()
        url = f"{RENDER_API_BASE_URL}/services/{self.service_id}/env-vars"
        self.logger.info(f"Updating Render environment variable '{key}' for service '{self.service_id}'...")

        payload = [{"key": key, "value": value}]

        try:
            response = requests.put(url, headers=self.headers, json=payload, timeout=15)
            
            if response.status_code in (200, 201):
                self.logger.info(f"Successfully updated environment variable '{key}' on Render.")
                return True
            elif response.status_code == 401:
                raise RenderAPIError("Render API HTTP 401 Unauthorized: Invalid RENDER_API_KEY.")
            elif response.status_code == 404:
                raise RenderAPIError(f"Render API HTTP 404 Not Found: Service ID '{self.service_id}' not found.")
            elif response.status_code == 429:
                raise RenderAPIError("Render API HTTP 429: Rate limit exceeded. Please wait before retrying.")
            else:
                # Fallback check for single key endpoint: PUT /services/{id}/env-vars/{key}
                single_var_url = f"{RENDER_API_BASE_URL}/services/{self.service_id}/env-vars/{key}"
                fallback_resp = requests.put(single_var_url, headers=self.headers, json={"value": value}, timeout=15)
                if fallback_resp.status_code in (200, 201):
                    self.logger.info(f"Successfully updated environment variable '{key}' via single key endpoint.")
                    return True
                
                raise RenderAPIError(
                    f"Render API returned error HTTP {response.status_code}: {response.text}"
                )

        except requests.RequestException as exc:
            raise RenderAPIError(f"Network error connecting to Render API: {exc}")

    def trigger_deployment(self) -> Dict[str, Any]:
        """
        Trigger a new manual deployment for the configured Render service.

        Returns:
            Dict[str, Any]: Render deploy object returned by API.

        Raises:
            RenderAPIError: If deployment trigger fails.
        """
        self._validate_credentials()
        url = f"{RENDER_API_BASE_URL}/services/{self.service_id}/deploys"
        self.logger.info(f"Triggering new deploy for Render service '{self.service_id}'...")

        payload = {"clearCache": "do_not_clear"}

        try:
            response = requests.post(url, headers=self.headers, json=payload, timeout=15)

            if response.status_code in (200, 201):
                data = response.json()
                deploy_id = data.get("id") or data.get("deploy", {}).get("id", "N/A")
                self.logger.info(f"Deploy triggered successfully! Deploy ID: {deploy_id}")
                return data
            elif response.status_code == 401:
                raise RenderAPIError("Render API HTTP 401 Unauthorized: Invalid RENDER_API_KEY.")
            elif response.status_code == 404:
                raise RenderAPIError(f"Render API HTTP 404 Not Found: Service ID '{self.service_id}' not found.")
            elif response.status_code == 429:
                raise RenderAPIError("Render API HTTP 429: Rate limit exceeded. Please wait before retrying.")
            else:
                raise RenderAPIError(
                    f"Failed to trigger deploy on Render (HTTP {response.status_code}): {response.text}"
                )

        except requests.RequestException as exc:
            raise RenderAPIError(f"Network error while triggering Render deployment: {exc}")
