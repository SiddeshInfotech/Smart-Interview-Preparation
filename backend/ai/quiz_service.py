"""
OpenRouter integration for adaptive quiz generation.
Provides resilient quiz question generation with multi-model fallbacks, retries,
automatic JSON cleaning, recursive list parsing, and schema validation/repair.
"""

import json
import logging
import time
from typing import Any, Dict, List

from .json_utils import (
    clean_json_string,
    extract_questions_list,
    validate_and_repair_question,
)
from .openrouter_service import OpenRouterServiceError, openrouter_service
from .prompts import quiz_generation_prompt

logger = logging.getLogger(__name__)


def generate_quiz_questions(
    topics: List[str],
    difficulty: str = "Medium",
    count: int = 10,
    mode: str = "MCQ",
    custom_instruction: str = ""
) -> List[Dict[str, Any]]:
    """
    Generate quiz questions using OpenRouter AI service with model fallback, retries,
    automatic JSON cleaning, recursive array extraction, and field validation/repair.

    Args:
        topics: List of topic strings (e.g. ["Python", "Django"]).
        difficulty: Easy, Medium, Hard.
        count: Number of questions requested.
        mode: MCQ / Coding Challenge / Mock Interview.
        custom_instruction: Additional prompt instructions.

    Returns:
        List[Dict[str, Any]]: Standardized list of question dictionaries matching:
        [
          {
            "text": str,
            "options": List[str],
            "correct": int,
            "hint": str,
            "explanation": str
          },
          ...
        ]
    """
    prompt = quiz_generation_prompt(
        topics=topics,
        difficulty=difficulty,
        count=count,
        mode=mode,
        custom_instruction=custom_instruction,
    )

    models = openrouter_service.get_models_for_feature("quiz")
    max_retries = openrouter_service.max_retries
    primary_model = models[0] if models else "google/gemini-2.0-flash-001"

    overall_failures: List[str] = []

    # Iterate through models in fallback hierarchy
    for model_idx, selected_model in enumerate(models, start=1):
        is_fallback = (selected_model != primary_model)

        for attempt in range(1, max_retries + 1):
            start_time = time.time()
            logger.info(
                f"[QuizService] Generation Request | Model: '{selected_model}' "
                f"({'FALLBACK' if is_fallback else 'PRIMARY'}, {model_idx}/{len(models)}) | "
                f"Attempt: {attempt}/{max_retries} | Mode: {mode} | Target Count: {count}"
            )

            try:
                # 1. API Call per selected model
                raw_text = openrouter_service.chat_with_model(
                    model=selected_model,
                    prompt=prompt,
                    temperature=0.7,
                    max_tokens=2000,
                    expect_json=True,
                )
                elapsed_time = round(time.time() - start_time, 2)
                response_length = len(raw_text)

                # 2. Automatic JSON Cleaning
                cleaned_text = clean_json_string(raw_text)
                if not cleaned_text:
                    raise ValueError("Cleaned response text is empty.")

                # 3. JSON Parsing
                try:
                    parsed_data = json.loads(cleaned_text)
                except Exception as json_err:
                    raise ValueError(f"Failed to parse cleaned JSON: {json_err}")

                # 4. Recursive Array Extraction
                raw_questions, extraction_method = extract_questions_list(parsed_data)
                if not raw_questions:
                    raise ValueError(
                        f"Could not locate a valid question list in parsed JSON (extraction_method: {extraction_method})"
                    )

                # 5. Validation and Auto-Repair for every question
                validated_questions: List[Dict[str, Any]] = []
                total_repairs = 0

                for item_idx, item in enumerate(raw_questions, start=1):
                    try:
                        valid_q, repaired = validate_and_repair_question(item, mode=mode)
                        validated_questions.append(valid_q)
                        if repaired:
                            total_repairs += 1
                    except Exception as q_err:
                        logger.warning(
                            f"[QuizService] Question #{item_idx} failed validation on model '{selected_model}': {q_err}"
                        )

                # Check if we have acceptable questions count
                if len(validated_questions) == 0:
                    raise ValueError("All extracted questions failed schema validation.")

                min_acceptable = min(count, max(1, count - 2))
                if len(validated_questions) < min_acceptable:
                    raise ValueError(
                        f"Insufficient valid questions generated: got {len(validated_questions)}, expected at least {min_acceptable}"
                    )

                # Truncate to exact requested count
                final_questions = validated_questions[:count]

                # 8. Detailed Metrics Logging
                logger.info("=" * 80)
                logger.info(
                    f"[QuizService] SUCCESS | Selected Model: '{selected_model}' | "
                    f"Fallback Model Used: '{selected_model if is_fallback else 'None'}' | "
                    f"Attempt: {attempt}/{max_retries} | Response Time: {elapsed_time}s | "
                    f"Response Length: {response_length} chars | Parsing Result: '{extraction_method}' | "
                    f"Validation Result: 'PASSED' ({len(final_questions)} questions) | "
                    f"Repairs Performed: {total_repairs}"
                )
                logger.info("=" * 80)

                return final_questions

            except Exception as failure:
                elapsed_time = round(time.time() - start_time, 2)
                retry_reason = str(failure)
                logger.warning(
                    f"[QuizService] FAILED | Model: '{selected_model}' | Attempt: {attempt}/{max_retries} | "
                    f"Time: {elapsed_time}s | Retry Reason: '{retry_reason}'"
                )

                if attempt < max_retries:
                    time.sleep(0.5 * attempt)
                    continue

                overall_failures.append(f"Model '{selected_model}' failed: {retry_reason}")

        logger.warning(
            f"[QuizService] Model '{selected_model}' failed all {max_retries} retries. "
            f"Falling back to next model in fallback list..."
        )

    # All models in fallback list failed all retries
    error_msg = f"All OpenRouter models ({models}) failed quiz generation. Details: {overall_failures}"
    logger.error(f"[QuizService] CRITICAL FAILURE: {error_msg}")
    raise OpenRouterServiceError(error_msg)