"""OpenRouter integration for coding challenge generation and evaluation."""

import logging
import time
from typing import Any, Dict

from .json_utils import clean_json_string, parse_json_robust
from .openrouter_service import (
    OpenRouterNonRetryableError,
    OpenRouterServiceError,
    openrouter_service,
)
from .prompts import code_evaluation_prompt, coding_challenge_prompt

logger = logging.getLogger(__name__)


def generate_coding_question(
    language: str,
    difficulty: str = "Medium",
    custom_instruction: str = ""
) -> Dict[str, Any]:
    """
    Generate a coding challenge tailored to language and difficulty using OpenRouter AI.
    Implements multi-model fallback, retries, and robust JSON parsing/repair.
    """
    prompt = coding_challenge_prompt(
        language=language,
        difficulty=difficulty,
        custom_instruction=custom_instruction,
    )

    models = openrouter_service.get_models_for_feature("coding")
    max_retries = openrouter_service.max_retries

    overall_failures = []

    for model_idx, selected_model in enumerate(models, start=1):
        for attempt in range(1, max_retries + 1):
            start_time = time.time()
            try:
                raw_text = openrouter_service.chat_with_model(
                    model=selected_model,
                    prompt=prompt,
                    temperature=0.7,
                    max_tokens=2500,
                    expect_json=True,
                )

                cleaned_text = clean_json_string(raw_text)
                parsed = parse_json_robust(cleaned_text)

                if isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], dict):
                    parsed = parsed[0]

                if not isinstance(parsed, dict):
                    raise ValueError(f"Expected dictionary object, got {type(parsed).__name__}")

                # Normalize mandatory coding fields
                normalized = {
                    "title": str(parsed.get("title") or f"{language} Coding Challenge").strip(),
                    "problem_statement": str(
                        parsed.get("problem_statement") or parsed.get("text") or parsed.get("description") or ""
                    ).strip(),
                    "sample_input": str(parsed.get("sample_input") or "").strip(),
                    "sample_output": str(parsed.get("sample_output") or "").strip(),
                    "hint": str(
                        parsed.get("hint") or "Consider using standard data structures and algorithmic techniques."
                    ).strip(),
                    "solution": str(parsed.get("solution") or parsed.get("explanation") or "").strip(),
                }

                if not normalized["problem_statement"]:
                    raise ValueError("Coding challenge missing non-empty problem_statement field.")

                elapsed = round(time.time() - start_time, 2)
                logger.info(
                    f"[CodingService] SUCCESS | Model: '{selected_model}' | Attempt: {attempt}/{max_retries} | Time: {elapsed}s"
                )
                return normalized

            except OpenRouterNonRetryableError as non_retryable_err:
                logger.warning(f"[CodingService] Non-retryable error on '{selected_model}': {non_retryable_err}")
                overall_failures.append(f"Model '{selected_model}': {non_retryable_err}")
                break

            except Exception as exc:
                elapsed = round(time.time() - start_time, 2)
                logger.warning(
                    f"[CodingService] FAILED | Model: '{selected_model}' | Attempt: {attempt}/{max_retries} | Error: {exc}"
                )
                if attempt < max_retries:
                    time.sleep(0.3 * attempt)
                    continue
                overall_failures.append(f"Model '{selected_model}': {exc}")

    raise OpenRouterServiceError(
        f"All OpenRouter models ({models}) failed coding question generation. Details: {overall_failures}"
    )


def evaluate_code_submission(
    language: str,
    problem_title: str,
    problem_statement: str,
    code: str,
    user_input: str,
    execution_output: str,
    execution_error: str
) -> Dict[str, Any]:
    """
    Evaluate candidate's code submission across correctness, complexity, and quality using OpenRouter AI.
    Implements multi-model fallback, retries, and robust JSON parsing/repair.
    """
    prompt = code_evaluation_prompt(
        language=language,
        problem_title=problem_title,
        problem_statement=problem_statement,
        code=code,
        user_input=user_input,
        execution_output=execution_output,
        execution_error=execution_error,
    )

    models = openrouter_service.get_models_for_feature("coding")
    max_retries = openrouter_service.max_retries

    overall_failures = []

    for selected_model in models:
        for attempt in range(1, max_retries + 1):
            try:
                raw_text = openrouter_service.chat_with_model(
                    model=selected_model,
                    prompt=prompt,
                    temperature=0.3,
                    max_tokens=2500,
                    expect_json=True,
                )

                cleaned_text = clean_json_string(raw_text)
                parsed = parse_json_robust(cleaned_text)

                if not isinstance(parsed, dict):
                    raise ValueError(f"Expected dictionary evaluation result, got {type(parsed).__name__}")

                return parsed

            except OpenRouterNonRetryableError as non_retryable_err:
                overall_failures.append(f"Model '{selected_model}': {non_retryable_err}")
                break

            except Exception as exc:
                if attempt < max_retries:
                    time.sleep(0.3 * attempt)
                    continue
                overall_failures.append(f"Model '{selected_model}': {exc}")

    raise OpenRouterServiceError(
        f"All OpenRouter models ({models}) failed code evaluation. Details: {overall_failures}"
    )
