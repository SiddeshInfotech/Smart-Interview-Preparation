"""
OpenRouter API Service.
Provides centralized, resilient AI generation using OpenRouter models, automatic model fallback,
retry logic, connection pooling via requests.Session, structured logging, and JSON mode handling.
"""

import concurrent.futures
import copy
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class OpenRouterServiceError(Exception):
    """Base exception raised when OpenRouter service encounters an unrecoverable failure."""
    pass


class OpenRouterAuthError(OpenRouterServiceError):
    """Raised when authentication or authorization fails (401/403)."""
    pass


class OpenRouterTimeoutError(OpenRouterServiceError):
    """Raised when connection or wall-clock timeout is exceeded."""
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
                "google/gemini-2.0-flash-001",
                "deepseek/deepseek-chat",
                "mistralai/mistral-small-24b-instruct-2501",
            ],
            "temperature": 0.3,
            "max_tokens": 1200,
            "expect_json": True,
        },
        "quiz": {
            "models": [
                "google/gemini-2.0-flash-001",
                "deepseek/deepseek-chat",
                "mistralai/mistral-small-24b-instruct-2501",
            ],
            "temperature": 0.7,
            "max_tokens": 700,
            "expect_json": True,
        },
        "coding": {
            "models": [
                "google/gemini-2.0-flash-001",
                "qwen/qwen-2.5-coder-32b-instruct",
                "deepseek/deepseek-chat",
            ],
            "temperature": 0.7,
            "max_tokens": 1000,
            "expect_json": True,
        },
        "feedback": {
            "models": [
                "google/gemini-2.0-flash-001",
                "deepseek/deepseek-chat",
            ],
            "temperature": 0.5,
            "max_tokens": 600,
            "expect_json": True,
        },
        "hr_interview": {
            "models": [
                "google/gemini-2.0-flash-001",
                "deepseek/deepseek-chat",
            ],
            "temperature": 0.7,
            "max_tokens": 700,
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
        self.connect_timeout: float = float(getattr(settings, "OPENROUTER_CONNECT_TIMEOUT", 5.0))
        self.read_timeout: float = float(getattr(settings, "OPENROUTER_READ_TIMEOUT", 25.0))
        self.total_timeout: float = float(getattr(settings, "OPENROUTER_TOTAL_TIMEOUT", 26.0))
        self.max_retries: int = int(getattr(settings, "OPENROUTER_MAX_RETRIES", 3))

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
                        "max_tokens": 700,
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
        return feat_config.get("models", ["google/gemini-2.0-flash-001"])

    def _execute_post(self, headers: dict, payload: dict) -> requests.Response:
        """
        Executes HTTP POST request using persistent Session and ThreadPoolExecutor
        to guarantee strict wall-clock timeout protection.
        """
        def _do_request():
            return self.session.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=(self.connect_timeout, self.read_timeout),
            )

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_do_request)
            try:
                return future.result(timeout=self.total_timeout)
            except concurrent.futures.TimeoutError:
                raise requests.exceptions.Timeout(
                    f"Hard wall-clock timeout of {self.total_timeout}s exceeded"
                )

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
        Send chat completion request to OpenRouter with explicit model fallback and automatic retries.

        Args:
            prompt: Text prompt to send to the model.
            feature: Category ('resume', 'quiz', 'coding', 'feedback', 'hr_interview').
            temperature: Optional temperature override.
            max_tokens: Optional max_tokens override.
            response_format: Optional OpenRouter response_format dict.
            expect_json: Optional boolean flag to validate and parse JSON response.

        Returns:
            str: Generated string response content.
        """
        feat_config = self.features.get(feature, self.features.get("quiz", {}))
        models = feat_config.get("models", ["google/gemini-2.0-flash-001"])

        resolved_temp = temperature if temperature is not None else feat_config.get("temperature", 0.7)
        resolved_max_tokens = max_tokens if max_tokens is not None else feat_config.get("max_tokens", 700)
        resolved_expect_json = expect_json if expect_json is not None else feat_config.get("expect_json", False)

        resolved_response_format = response_format
        if resolved_expect_json and resolved_response_format is None:
            resolved_response_format = {"type": "json_object"}

        headers = self._get_headers()
        overall_errors: List[str] = []

        # Explicit Model Fallback Loop
        for model_idx, selected_model in enumerate(models, start=1):
            # Payload contains ONLY "model": selected_model
            payload: Dict[str, Any] = {
                "model": selected_model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": resolved_temp,
                "max_tokens": resolved_max_tokens,
            }
            if resolved_response_format:
                payload["response_format"] = resolved_response_format

            # Inner retry loop per model
            for attempt in range(1, self.max_retries + 1):
                start_time = time.time()
                logger.info(
                    f"[OpenRouter] Request | Feature: '{feature}' | Model: '{selected_model}' ({model_idx}/{len(models)}) | "
                    f"Attempt: {attempt}/{self.max_retries}"
                )

                try:
                    response = self._execute_post(headers, payload)
                    elapsed_time = round(time.time() - start_time, 2)
                    status_code = response.status_code

                    if status_code == 200:
                        try:
                            resp_data = response.json()
                            choices = resp_data.get("choices", [])
                            if not choices:
                                raise OpenRouterServiceError("OpenRouter response choices array is empty.")

                            content = choices[0].get("message", {}).get("content", "")
                            if not content or not content.strip():
                                raise OpenRouterServiceError("OpenRouter returned empty message content.")

                            if resolved_expect_json:
                                cleaned_content = self.clean_json_string(content)
                                try:
                                    json.loads(cleaned_content)
                                except Exception as json_err:
                                    err_msg = f"JSON validation failed on model '{selected_model}' attempt {attempt}: {json_err}"
                                    logger.warning(f"[OpenRouter] {err_msg}")
                                    if attempt < self.max_retries:
                                        time.sleep(0.5)
                                        continue
                                    raise OpenRouterJSONError(err_msg)

                            logger.info(
                                f"[OpenRouter] Success | Feature: '{feature}' | Model: '{selected_model}' | "
                                f"Attempt: {attempt}/{self.max_retries} | Time: {elapsed_time}s"
                            )
                            return content

                        except json.JSONDecodeError as exc:
                            raise OpenRouterJSONError(f"Failed to decode HTTP JSON response body: {exc}")

                    elif status_code in self.RETRY_STATUS_CODES:
                        err_msg = f"HTTP {status_code} retryable status from '{selected_model}': {response.text[:150]}"
                        logger.warning(
                            f"[OpenRouter] {err_msg} | Attempt: {attempt}/{self.max_retries} | Time: {elapsed_time}s"
                        )
                        if attempt < self.max_retries:
                            time.sleep(0.5 * attempt)
                            continue
                        overall_errors.append(f"Model '{selected_model}': {err_msg}")

                    elif status_code in (401, 403):
                        err_msg = f"HTTP {status_code} Auth failure: Access denied or invalid OPENROUTER_API_KEY."
                        logger.error(f"[OpenRouter] {err_msg}")
                        raise OpenRouterAuthError(err_msg)

                    else:
                        err_msg = f"HTTP {status_code} Non-retryable error from '{selected_model}': {response.text[:150]}"
                        logger.warning(f"[OpenRouter] {err_msg}")
                        overall_errors.append(f"Model '{selected_model}': {err_msg}")
                        break

                except requests.exceptions.ConnectTimeout as conn_err:
                    elapsed = round(time.time() - start_time, 2)
                    err_msg = f"Connect Timeout ({self.connect_timeout}s) on '{selected_model}': {conn_err}"
                    logger.warning(f"[OpenRouter] {err_msg} | Attempt: {attempt}/{self.max_retries} | Time: {elapsed}s")
                    if attempt < self.max_retries:
                        time.sleep(0.5)
                        continue
                    overall_errors.append(f"Model '{selected_model}': {err_msg}")

                except requests.exceptions.ReadTimeout as read_err:
                    elapsed = round(time.time() - start_time, 2)
                    err_msg = f"Read Timeout ({self.read_timeout}s) on '{selected_model}': {read_err}"
                    logger.warning(f"[OpenRouter] {err_msg} | Attempt: {attempt}/{self.max_retries} | Time: {elapsed}s")
                    if attempt < self.max_retries:
                        time.sleep(0.5)
                        continue
                    overall_errors.append(f"Model '{selected_model}': {err_msg}")

                except requests.exceptions.Timeout as timeout_err:
                    elapsed = round(time.time() - start_time, 2)
                    err_msg = f"Total Wall-Clock Timeout ({self.total_timeout}s) on '{selected_model}': {timeout_err}"
                    logger.warning(f"[OpenRouter] {err_msg} | Attempt: {attempt}/{self.max_retries} | Time: {elapsed}s")
                    if attempt < self.max_retries:
                        time.sleep(0.5)
                        continue
                    overall_errors.append(f"Model '{selected_model}': {err_msg}")

                except (requests.exceptions.ConnectionError, requests.exceptions.RequestException) as net_err:
                    elapsed = round(time.time() - start_time, 2)
                    err_msg = f"Network Error ({type(net_err).__name__}) on '{selected_model}': {net_err}"
                    logger.warning(f"[OpenRouter] {err_msg} | Attempt: {attempt}/{self.max_retries} | Time: {elapsed}s")
                    if attempt < self.max_retries:
                        time.sleep(0.5)
                        continue
                    overall_errors.append(f"Model '{selected_model}': {err_msg}")

                except OpenRouterJSONError as json_err:
                    elapsed = round(time.time() - start_time, 2)
                    logger.warning(f"[OpenRouter] JSON Error on '{selected_model}': {json_err}")
                    overall_errors.append(f"Model '{selected_model}': {json_err}")

                except OpenRouterAuthError:
                    raise

                except OpenRouterHttpError as http_err:
                    logger.warning(f"[OpenRouter] HTTP Error on '{selected_model}': {http_err}")
                    overall_errors.append(f"Model '{selected_model}': {http_err}")
                    break

                except OpenRouterServiceError as svc_err:
                    logger.warning(f"[OpenRouter] Service error on '{selected_model}': {svc_err}")
                    overall_errors.append(f"Model '{selected_model}': {svc_err}")

                except Exception as unhandled_err:
                    logger.error(f"[OpenRouter] Unexpected error on '{selected_model}': {unhandled_err}")
                    overall_errors.append(f"Model '{selected_model}': {unhandled_err}")

            # Selected model failed all retries; fall back to next model
            logger.warning(
                f"[OpenRouter] Model '{selected_model}' failed all {self.max_retries} retries. "
                f"Falling back to next model in fallback list..."
            )

        raise OpenRouterServiceError(
            f"All models ({models}) failed for feature '{feature}'. Errors encountered: {overall_errors}"
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
