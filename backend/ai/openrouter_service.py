"""
OpenRouter API Service.
Provides centralized, resilient AI generation using OpenRouter models, automatic model fallback,
retry logic, connection pooling via requests.Session, structured logging, and JSON mode handling.
"""

import copy
import json
import logging
import time
from typing import Any, Dict, List, Optional
import requests
from django.conf import settings

from .json_utils import clean_json_string as utils_clean_json_string

logger = logging.getLogger(__name__)


class OpenRouterServiceError(Exception):
    """Base exception raised when OpenRouter service encounters an unrecoverable failure."""
    pass


class OpenRouterAuthError(OpenRouterServiceError):
    """Raised when authentication or authorization fails (401/403)."""
    pass


class OpenRouterNonRetryableError(OpenRouterServiceError):
    """Raised when OpenRouter returns non-retryable error (404 / No endpoints found)."""
    pass


class OpenRouterTimeoutError(OpenRouterServiceError):
    """Raised when connection or read timeout is exceeded."""
    pass


class OpenRouterHttpError(OpenRouterServiceError):
    """Raised when OpenRouter returns non-200 HTTP status code."""
    pass


class OpenRouterJSONError(OpenRouterServiceError):
    """Raised when OpenRouter response fails JSON formatting or parsing."""
    pass


class OpenRouterService:
    """
    Centralized service for invoking OpenRouter chat completion APIs.
    Follows SOLID principles and provides multi-model routing, retries, and logging.
    """

    RETRY_STATUS_CODES = {429, 502, 503, 504}

    DEFAULT_FEATURES: Dict[str, Dict[str, Any]] = {
        "resume": {
            "models": [
                "google/gemini-2.0-flash-01",
                "deepseek/deepseek-chat",
                "meta-llama/llama-3.3-70b-instruct",
            ],
            "temperature": 0.3,
            "max_tokens": 1500,
            "expect_json": True,
        },
        "quiz": {
            "models": [
                "google/gemini-2.0-flash-01",
                "deepseek/deepseek-chat",
                "meta-llama/llama-3.3-70b-instruct",
                "qwen/qwen-2.5-coder-32b-instruct",
                "mistralai/mistral-small-24b-instruct-2501",
            ],
            "temperature": 0.7,
            "max_tokens": 2000,
            "expect_json": True,
        },
        "coding": {
            "models": [
                "google/gemini-2.0-flash-01",
                "qwen/qwen-2.5-coder-32b-instruct",
                "deepseek/deepseek-chat",
            ],
            "temperature": 0.7,
            "max_tokens": 2500,
            "expect_json": True,
        },
        "feedback": {
            "models": [
                "google/gemini-2.0-flash-01",
                "deepseek/deepseek-chat",
            ],
            "temperature": 0.5,
            "max_tokens": 1500,
            "expect_json": True,
        },
    }

    def __init__(self):
        self.api_key: str = getattr(settings, "OPENROUTER_API_KEY", "")
        self.api_url: str = getattr(
            settings,
            "OPENROUTER_API_URL",
            "https://openrouter.ai/api/v1/chat/completions",
        )
        self.connect_timeout: float = float(getattr(settings, "OPENROUTER_CONNECT_TIMEOUT", 4.0))
        self.read_timeout: float = float(getattr(settings, "OPENROUTER_READ_TIMEOUT", 10.0))
        self.total_timeout: float = float(getattr(settings, "OPENROUTER_TOTAL_TIMEOUT", 12.0))
        self.max_retries: int = int(getattr(settings, "OPENROUTER_MAX_RETRIES", 2))

        # Connection pooling via persistent session
        self.session = requests.Session()

        # Load feature configurations
        self.features: Dict[str, Dict[str, Any]] = self._load_features()

    def _load_features(self) -> Dict[str, Dict[str, Any]]:
        """Load and merge feature configurations from settings or defaults."""
        features = copy.deepcopy(self.DEFAULT_FEATURES)

        user_ai_models = getattr(settings, "AI_MODELS", None)
        if isinstance(user_ai_models, dict):
            for feat, models in user_ai_models.items():
                if feat in features and isinstance(models, list):
                    features[feat]["models"] = models
                elif isinstance(models, list):
                    features[feat] = {
                        "models": models,
                        "temperature": 0.7,
                        "max_tokens": 1500,
                        "expect_json": False,
                    }

        user_feature_configs = getattr(settings, "AI_FEATURE_CONFIGS", None)
        if isinstance(user_feature_configs, dict):
            for feat, cfg in user_feature_configs.items():
                if isinstance(cfg, dict):
                    if feat not in features:
                        features[feat] = copy.deepcopy(cfg)
                    else:
                        features[feat].update(cfg)

        return features

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
        feat_config = self.features.get(feature, self.features.get("quiz", {}))
        return feat_config.get("models", ["google/gemini-2.0-flash-01"])

    def _execute_post(self, headers: dict, payload: dict) -> requests.Response:
        """
        Executes HTTP POST request using persistent Session with clean socket timeouts.
        Avoids ThreadPoolExecutor blocking to prevent Gunicorn worker thread deadlocks.
        """
        return self.session.post(
            self.api_url,
            headers=headers,
            json=payload,
            timeout=(self.connect_timeout, self.read_timeout),
        )

    def chat_with_model(
        self,
        model: str,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 1500,
        expect_json: bool = False,
    ) -> str:
        """
        Single HTTP post invocation targeting a specific OpenRouter model.
        """
        headers = self._get_headers()
        payload: Dict[str, Any] = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if expect_json:
            payload["response_format"] = {"type": "json_object"}

        response = self._execute_post(headers, payload)

        # Fallback if model rejects response_format with 400 Bad Request
        if response.status_code == 400 and expect_json and "response_format" in payload:
            logger.warning(
                f"[OpenRouter] Model '{model}' rejected response_format json_object (HTTP 400). "
                f"Retrying request without response_format parameter..."
            )
            payload.pop("response_format")
            response = self._execute_post(headers, payload)

        status_code = response.status_code
        resp_text = response.text

        if status_code == 200:
            try:
                resp_data = response.json()
                choices = resp_data.get("choices", [])
                if not choices:
                    raise OpenRouterServiceError(f"Model '{model}' returned empty choices array.")

                content = choices[0].get("message", {}).get("content", "")
                if not content or not content.strip():
                    raise OpenRouterServiceError(f"Model '{model}' returned empty message content.")

                return content
            except json.JSONDecodeError as exc:
                raise OpenRouterJSONError(f"Failed to decode HTTP response body as JSON from '{model}': {exc}")

        elif status_code == 404 or "No endpoints found" in resp_text:
            raise OpenRouterNonRetryableError(
                f"HTTP {status_code} Non-retryable model error from '{model}': {resp_text[:150]}"
            )

        elif status_code in (401, 403):
            raise OpenRouterAuthError(f"HTTP {status_code} Auth failure: Invalid or missing OPENROUTER_API_KEY.")

        elif status_code in self.RETRY_STATUS_CODES:
            raise OpenRouterHttpError(f"HTTP {status_code} retryable status code from model '{model}': {resp_text[:150]}")

        else:
            raise OpenRouterHttpError(f"HTTP {status_code} error from model '{model}': {resp_text[:150]}")

    def chat(
        self,
        prompt: str,
        feature: str = "quiz",
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        response_format: Optional[Dict[str, Any]] = None,
        expect_json: Optional[bool] = None,
    ) -> str:
        """
        Send chat completion request to OpenRouter with automatic model fallback and retries.
        """
        feat_config = self.features.get(feature, self.features.get("quiz", {}))
        models = feat_config.get("models", ["google/gemini-2.0-flash-01"])

        resolved_temp = temperature if temperature is not None else feat_config.get("temperature", 0.7)
        resolved_max_tokens = max_tokens if max_tokens is not None else feat_config.get("max_tokens", 1500)
        resolved_expect_json = expect_json if expect_json is not None else feat_config.get("expect_json", False)

        overall_errors: List[str] = []
        primary_model = models[0] if models else "unknown"

        for model_idx, selected_model in enumerate(models, start=1):
            is_fallback = (selected_model != primary_model)

            for attempt in range(1, self.max_retries + 1):
                start_time = time.time()
                logger.info(
                    f"[OpenRouter] Request | Feature: '{feature}' | Model: '{selected_model}' "
                    f"({'FALLBACK' if is_fallback else 'PRIMARY'}, {model_idx}/{len(models)}) | "
                    f"Attempt: {attempt}/{self.max_retries}"
                )

                try:
                    content = self.chat_with_model(
                        model=selected_model,
                        prompt=prompt,
                        temperature=resolved_temp,
                        max_tokens=resolved_max_tokens,
                        expect_json=resolved_expect_json,
                    )
                    elapsed_time = round(time.time() - start_time, 2)

                    logger.info(
                        f"[OpenRouter] Success | Feature: '{feature}' | Selected Model: '{selected_model}' | "
                        f"Fallback Model: '{selected_model if is_fallback else 'None'}' | "
                        f"Attempt: {attempt}/{self.max_retries} | Time: {elapsed_time}s | Response Length: {len(content)} chars"
                    )
                    return content

                except OpenRouterAuthError as auth_err:
                    logger.error(f"[OpenRouter] Auth Failure: {auth_err}")
                    raise

                except OpenRouterNonRetryableError as non_retryable_err:
                    elapsed = round(time.time() - start_time, 2)
                    logger.warning(
                        f"[OpenRouter] Non-retryable error on '{selected_model}' ({elapsed}s): {non_retryable_err}. "
                        f"Failing model immediately and moving to next fallback model..."
                    )
                    overall_errors.append(f"Model '{selected_model}': {non_retryable_err}")
                    break  # Break attempt loop for this model immediately!

                except (requests.exceptions.Timeout, OpenRouterTimeoutError) as timeout_err:
                    elapsed = round(time.time() - start_time, 2)
                    err_msg = f"Timeout ({elapsed}s) on '{selected_model}': {timeout_err}"
                    logger.warning(f"[OpenRouter] {err_msg} | Attempt {attempt}/{self.max_retries}")
                    if attempt < self.max_retries:
                        time.sleep(0.3 * attempt)
                        continue
                    overall_errors.append(f"Model '{selected_model}' attempt {attempt}: {err_msg}")

                except Exception as err:
                    elapsed = round(time.time() - start_time, 2)
                    err_msg = f"Error on '{selected_model}' ({type(err).__name__}): {err}"
                    logger.warning(f"[OpenRouter] {err_msg} | Attempt {attempt}/{self.max_retries}")
                    if attempt < self.max_retries:
                        time.sleep(0.3 * attempt)
                        continue
                    overall_errors.append(f"Model '{selected_model}' attempt {attempt}: {err_msg}")

            logger.warning(
                f"[OpenRouter] Model '{selected_model}' finished attempts. "
                f"Moving to next fallback model..."
            )

        raise OpenRouterServiceError(
            f"All models ({models}) failed for feature '{feature}'. Errors: {overall_errors}"
        )

    @staticmethod
    def clean_json_string(raw_text: str) -> str:
        """Utility to strip markdown code blocks and extract raw JSON object or array."""
        return utils_clean_json_string(raw_text)


# Global service instance for easy import across modules
openrouter_service = OpenRouterService()


def generate_content(prompt: str, feature: str = "quiz", expect_json: bool = False) -> str:
    """
    Backwards-compatible top-level function that delegates to OpenRouterService.
    Replaces old gemini_service.generate_content.
    """
    return openrouter_service.chat(prompt=prompt, feature=feature, expect_json=expect_json)
