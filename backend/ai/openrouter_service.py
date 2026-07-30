"""
OpenRouter API Service.
Provides centralized, resilient AI generation using OpenRouter models, automatic model fallback, retry logic, error handling, and JSON validation.
"""

import json
import logging
import re
import time
from typing import Any, Dict, List, Optional
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class OpenRouterServiceError(Exception):
    """Custom exception raised when OpenRouter service encounters an unrecoverable failure."""
    pass


class OpenRouterService:
    """
    Centralized service for invoking OpenRouter chat completion APIs.
    Follows SOLID principles and provides multi-model routing, retries, and logging.
    """

    RETRY_STATUS_CODES = {429, 502, 503, 504}
    MAX_ATTEMPTS = 2
    TIMEOUT_SECONDS = 18

    def __init__(self):
        self.api_key: str = getattr(settings, "OPENROUTER_API_KEY", "")
        self.api_url: str = getattr(
            settings,
            "OPENROUTER_API_URL",
            "https://openrouter.ai/api/v1/chat/completions"
        )
        self.ai_models: Dict[str, List[str]] = getattr(
            settings,
            "AI_MODELS",
            {
                "resume": ["deepseek/deepseek-chat", "google/gemini-2.0-flash-lite-001", "mistralai/mistral-small-24b-instruct-2501"],
                "quiz": ["deepseek/deepseek-chat", "google/gemini-2.0-flash-lite-001", "mistralai/mistral-small-24b-instruct-2501"],
                "coding": ["qwen/qwen-2.5-coder-32b-instruct", "deepseek/deepseek-chat", "google/gemini-2.0-flash-lite-001"],
                "feedback": ["deepseek/deepseek-chat", "google/gemini-2.0-flash-lite-001"],
                "hr_interview": ["deepseek/deepseek-chat", "google/gemini-2.0-flash-lite-001"]
            }
        )

    def _get_headers(self) -> Dict[str, str]:
        """Construct request headers without exposing secret API key in logs."""
        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": "https://prepmaster.ai",
            "X-Title": "PrepMaster AI",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def get_models_for_feature(self, feature: str) -> List[str]:
        """Retrieve model fallback hierarchy configured for a feature."""
        return self.ai_models.get(feature, self.ai_models.get("quiz", ["deepseek/deepseek-chat"]))

    def chat(
        self,
        prompt: str,
        feature: str = "quiz",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, Any]] = None,
        expect_json: bool = False,
    ) -> str:
        """
        Send chat completion request to OpenRouter with automatic retries and fallback models.

        Args:
            prompt: Text prompt to send to the model.
            feature: Feature category name ('resume', 'quiz', 'coding', 'feedback', 'hr_interview').
            temperature: Sampling temperature.
            max_tokens: Maximum tokens in response.
            response_format: Optional OpenRouter response_format (e.g. {"type": "json_object"}).
            expect_json: If True, validates JSON output and retries once if invalid.

        Returns:
            str: Generated content from model response.
        """
        models = self.get_models_for_feature(feature)
        headers = self._get_headers()

        payload: Dict[str, Any] = {
            "models": models,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        if response_format:
            payload["response_format"] = response_format

        last_error_message = ""

        for attempt in range(1, self.MAX_ATTEMPTS + 1):
            start_time = time.time()
            attempt_timeout = self.TIMEOUT_SECONDS if attempt == 1 else 7
            logger.info(
                f"[OpenRouter] Request started | Feature: {feature} | Attempt: {attempt}/{self.MAX_ATTEMPTS} | Timeout: {attempt_timeout}s | Models: {models}"
            )

            try:
                response = requests.post(
                    self.api_url,
                    headers=headers,
                    json=payload,
                    timeout=attempt_timeout
                )
                elapsed_time = round(time.time() - start_time, 2)
                status_code = response.status_code

                logger.info(
                    f"[OpenRouter] Response received | Feature: {feature} | Status: {status_code} | Time: {elapsed_time}s"
                )

                if status_code == 200:
                    try:
                        resp_data = response.json()
                        choices = resp_data.get("choices", [])
                        if not choices:
                            raise OpenRouterServiceError("OpenRouter response contains empty choices list.")

                        content = choices[0].get("message", {}).get("content", "")
                        if not content or not content.strip():
                            raise OpenRouterServiceError("OpenRouter returned empty content string.")

                        # Validate JSON format if expect_json=True
                        if expect_json:
                            cleaned_content = self.clean_json_string(content)
                            try:
                                json.loads(cleaned_content)
                            except Exception as json_err:
                                logger.warning(
                                    f"[OpenRouter] JSON parsing failed on attempt {attempt}: {json_err}"
                                )
                                if attempt < self.MAX_ATTEMPTS:
                                    time.sleep(0.5)
                                    continue
                                raise OpenRouterServiceError(f"OpenRouter output failed JSON validation: {json_err}")

                        return content

                    except json.JSONDecodeError as exc:
                        raise OpenRouterServiceError(f"Failed to decode OpenRouter HTTP JSON response: {exc}")

                elif status_code in self.RETRY_STATUS_CODES:
                    last_error_message = f"HTTP {status_code}: {response.text[:200]}"
                    logger.warning(
                        f"[OpenRouter] Retryable status code {status_code} on attempt {attempt}/{self.MAX_ATTEMPTS}"
                    )
                    if attempt < self.MAX_ATTEMPTS:
                        time.sleep(0.5)
                        continue

                elif status_code == 401:
                    raise OpenRouterServiceError("401 Unauthorized: Invalid or missing OPENROUTER_API_KEY.")
                elif status_code == 403:
                    raise OpenRouterServiceError("403 Forbidden: Access denied by OpenRouter.")
                else:
                    raise OpenRouterServiceError(f"HTTP {status_code} error from OpenRouter: {response.text[:200]}")

            except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as net_err:
                elapsed_time = round(time.time() - start_time, 2)
                last_error_message = f"Network Error ({type(net_err).__name__}): {net_err}"
                logger.warning(
                    f"[OpenRouter] Network failure on attempt {attempt}/{self.MAX_ATTEMPTS} after {elapsed_time}s: {net_err}"
                )
                if attempt < self.MAX_ATTEMPTS:
                    time.sleep(0.5)
                    continue

            except OpenRouterServiceError:
                raise

            except Exception as unhandled_err:
                logger.error(f"[OpenRouter] Unexpected error: {unhandled_err}")
                raise OpenRouterServiceError(f"Unexpected AI execution error: {unhandled_err}")

        raise OpenRouterServiceError(
            f"OpenRouter service failed for feature '{feature}' after {self.MAX_ATTEMPTS} attempts. Last error: {last_error_message}"
        )

    @staticmethod
    def clean_json_string(raw_text: str) -> str:
        """Utility to strip markdown code blocks and extract raw JSON object or array."""
        if not isinstance(raw_text, str):
            return ""
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_text.strip(), flags=re.IGNORECASE).strip()
        if not (cleaned.startswith("{") or cleaned.startswith("[")):
            match = re.search(r"(\{.*\}|\[.*\])", cleaned, flags=re.DOTALL)
            if match:
                cleaned = match.group(0)
        return cleaned


# Global service instance for easy import across modules
openrouter_service = OpenRouterService()


def generate_content(prompt: str, feature: str = "quiz", expect_json: bool = False) -> str:
    """
    Backwards-compatible top-level function that delegates to OpenRouterService.
    Replaces old gemini_service.generate_content.
    """
    return openrouter_service.chat(prompt=prompt, feature=feature, expect_json=expect_json)
