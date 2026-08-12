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
    parse_json_robust,
    validate_and_repair_question,
)
from .openrouter_service import (
    OpenRouterAuthError,
    OpenRouterNonRetryableError,
    OpenRouterServiceError,
    openrouter_service,
)
from .prompts import quiz_generation_prompt

logger = logging.getLogger(__name__)


def generate_quiz_questions(
    topics: List[str],
    difficulty: str = "Medium",
    count: int = 10,
    mode: str = "MCQ",
    custom_instruction: str = "",
    personalization_context: dict = None
) -> List[Dict[str, Any]]:
    """
    Generate quiz questions using OpenRouter AI service with model fallback, retries,
    automatic JSON cleaning, recursive array extraction, and field validation/repair.
    """
    prompt = quiz_generation_prompt(
        topics=topics,
        difficulty=difficulty,
        count=count,
        mode=mode,
        custom_instruction=custom_instruction,
        personalization_context=personalization_context,
    )

    models = openrouter_service.get_models_for_feature("quiz")
    max_retries = openrouter_service.max_retries
    primary_model = models[0] if models else "google/gemini-2.0-flash-01"

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
                    parsed_data = parse_json_robust(cleaned_text)
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

                # Detailed Metrics Logging
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

            except OpenRouterAuthError as auth_err:
                logger.warning(f"[QuizService] Auth failure ({auth_err}). Returning instant fallback quiz questions.")
                return get_fallback_quiz_questions(topics=topics, count=count)

            except OpenRouterNonRetryableError as non_retryable_err:
                elapsed_time = round(time.time() - start_time, 2)
                logger.warning(
                    f"[QuizService] NON-RETRYABLE ERROR | Model: '{selected_model}' | "
                    f"Time: {elapsed_time}s | Reason: '{non_retryable_err}'"
                )
                overall_failures.append(f"Model '{selected_model}': {non_retryable_err}")
                break  # Immediately move to next fallback model

            except Exception as failure:
                elapsed_time = round(time.time() - start_time, 2)
                retry_reason = str(failure)
                logger.warning(
                    f"[QuizService] FAILED | Model: '{selected_model}' | Attempt: {attempt}/{max_retries} | "
                    f"Time: {elapsed_time}s | Retry Reason: '{retry_reason}'"
                )

                if attempt < max_retries:
                    time.sleep(0.3 * attempt)
                    continue

                overall_failures.append(f"Model '{selected_model}' failed: {retry_reason}")

        logger.warning(
            f"[QuizService] Model '{selected_model}' finished attempts. "
            f"Falling back to next model in fallback list..."
        )

    # If AI models fail or API key is invalid/missing, return instant topic-tailored fallback questions
    error_msg = f"All OpenRouter models ({models}) failed quiz generation. Details: {overall_failures}"
    logger.warning(f"[QuizService] AI service unavailable ({error_msg}). Returning topic-tailored fallback quiz questions.")
    return get_fallback_quiz_questions(topics=topics, count=count)


def get_fallback_quiz_questions(topics: List[str], count: int = 10) -> List[Dict[str, Any]]:
    topic_str = topics[0] if topics and isinstance(topics, list) else "Web Development"
    all_fallbacks = [
        {
            "text": f"What is a primary principle or fundamental concept in {topic_str}?",
            "options": [
                "Strict procedural execution without modularity",
                "Modular design, clear separation of concerns, and clean structure",
                "Direct memory manipulation without error boundaries",
                "Deprecated monolithic file management"
            ],
            "correct": 1,
            "explanation": f"In {topic_str}, modular design and separation of concerns ensure scalable, maintainable application architecture."
        },
        {
            "text": f"Which of the following is considered a best practice when working with {topic_str}?",
            "options": [
                "Ignoring exception handling and system errors",
                "Writing clean, self-documenting code with proper validation",
                "Hardcoding dynamic parameters directly into source files",
                "Skipping automated build and test pipelines"
            ],
            "correct": 1,
            "explanation": "Writing clean, modular code with robust validation and exception handling is essential for reliable software development."
        },
        {
            "text": f"In {topic_str}, what is the main advantage of using standardized libraries and frameworks?",
            "options": [
                "They slow down overall application startup time",
                "They provide tested utilities, improve productivity, and enhance maintainability",
                "They prevent code execution in browser environments",
                "They eliminate the need for version control system tracking"
            ],
            "correct": 1,
            "explanation": "Frameworks and standard libraries reduce boilerplate code, optimize performance, and enforce industry-standard architectural patterns."
        },
        {
            "text": f"Which tool or technique is commonly used for version control in {topic_str} projects?",
            "options": [
                "FTP Direct Upload",
                "Git & GitHub",
                "Manual Zip Archiving",
                "Local Copying"
            ],
            "correct": 1,
            "explanation": "Git is the industry standard distributed version control system for tracking changes and collaborating on codebase repositories."
        },
        {
            "text": f"What is the role of automated testing in {topic_str} application development?",
            "options": [
                "To increase runtime memory consumption",
                "To catch regressions early and ensure code stability before release",
                "To replace continuous integration deployment servers",
                "To disable compiler warning flags"
            ],
            "correct": 1,
            "explanation": "Automated test suites verify system contracts, prevent regression bugs, and enable confident deployment cycles."
        },
        {
            "text": f"How does error handling contribute to robust {topic_str} software design?",
            "options": [
                "It suppresses all log messages permanently",
                "It allows applications to recover gracefully from unexpected failures without crashing",
                "It bypasses security authentication checks",
                "It increases network payload bandwidth"
            ],
            "correct": 1,
            "explanation": "Proper exception handling catches edge cases, prevents unhandled crashes, and provides meaningful diagnostics."
        },
        {
            "text": f"Which of the following best describes API endpoint contracts in {topic_str}?",
            "options": [
                "Randomized data exchange formats",
                "Structured specifications for requests, parameters, and responses between services",
                "Database file locking policies",
                "Operating system thread schedulers"
            ],
            "correct": 1,
            "explanation": "API contracts define expected request formats, authentication requirements, and structured JSON response schemas."
        },
        {
            "text": f"What is a key consideration when optimizing application performance in {topic_str}?",
            "options": [
                "Minimizing unnecessary database queries and network calls",
                "Removing index files from database tables",
                "Increasing global variable mutations",
                "Disabling HTTP response caching"
            ],
            "correct": 0,
            "explanation": "Optimizing database queries, caching frequent reads, and minimizing unnecessary network round-trips significantly boost performance."
        },
        {
            "text": f"Why is secure state management important in {topic_str} applications?",
            "options": [
                "It prevents unauthorized access and protects sensitive user data",
                "It forces all users to clear local cache on every click",
                "It slows down page navigation transitions",
                "It limits the maximum file size of source files"
            ],
            "correct": 0,
            "explanation": "Secure state and token management protect user credentials, session state, and sensitive backend data from tampering."
        },
        {
            "text": f"In continuous integration (CI/CD) pipelines for {topic_str}, what is the primary goal of the build step?",
            "options": [
                "To verify code syntax, compile static assets, and ensure clean execution",
                "To delete outdated database backups",
                "To modify user account passwords",
                "To generate dummy database records"
            ],
            "correct": 0,
            "explanation": "CI/CD build steps validate code integrity, check syntax, run automated unit tests, and prepare production bundles."
        }
    ]
    return all_fallbacks[:count]


def generate_chapter_quiz_questions(
    course_name: str,
    chapter_name: str,
    pdf_content: str,
    count: int = 10,
    difficulty: str = "Medium",
    materials_list: list = None,
) -> List[Dict[str, Any]]:
    """
    Generate chapter quiz questions strictly grounded in supplied PDF materials context.
    Performs OpenRouter AI call using Gemini 2.0 Flash, cleaning, extraction, validation, and source traceability.
    """
    from .prompts import chapter_quiz_generation_prompt

    prompt = chapter_quiz_generation_prompt(
        course_name=course_name,
        chapter_name=chapter_name,
        pdf_content=pdf_content,
        count=count,
        difficulty=difficulty,
    )

    models = openrouter_service.get_models_for_feature("quiz")
    primary_model = models[0] if models else "google/gemini-2.0-flash-01"

    for attempt in range(1, 3):
        try:
            raw_text = openrouter_service.chat_with_model(
                model=primary_model,
                prompt=prompt,
                temperature=0.4,
                max_tokens=2500,
                expect_json=True,
            )
            cleaned_text = clean_json_string(raw_text)
            if not cleaned_text:
                continue

            parsed_data = parse_json_robust(cleaned_text)
            raw_questions, _ = extract_questions_list(parsed_data)

            if not raw_questions or not isinstance(raw_questions, list):
                continue

            validated_questions = []
            default_material_name = materials_list[0]["filename"] if (materials_list and len(materials_list) > 0) else "Chapter Material PDF"

            for item in raw_questions:
                if not isinstance(item, dict):
                    continue

                q_text = item.get("text") or item.get("question") or item.get("question_text")
                opts = item.get("options") or []
                exp = item.get("explanation") or "Answer justified directly by chapter study material."
                src_mat = item.get("source_material") or default_material_name
                src_top = item.get("source_topic") or f"{chapter_name} Concepts"

                if not q_text or not isinstance(opts, list) or len(opts) != 4:
                    continue

                # Clean options
                clean_opts = [str(o).strip() for o in opts if str(o).strip()]
                if len(clean_opts) != 4:
                    continue

                correct_idx = item.get("correct")
                correct_str = item.get("correct_answer")

                if correct_idx is not None and isinstance(correct_idx, int) and 0 <= correct_idx <= 3:
                    final_correct_idx = correct_idx
                    final_correct_str = clean_opts[correct_idx]
                elif correct_str and str(correct_str).strip() in clean_opts:
                    final_correct_str = str(correct_str).strip()
                    final_correct_idx = clean_opts.index(final_correct_str)
                else:
                    final_correct_idx = 0
                    final_correct_str = clean_opts[0]

                validated_questions.append({
                    "text": str(q_text).strip(),
                    "options": clean_opts,
                    "correct": final_correct_idx,
                    "correct_answer": final_correct_str,
                    "explanation": str(exp).strip(),
                    "source_material": str(src_mat).strip(),
                    "source_topic": str(src_top).strip(),
                })

            if len(validated_questions) >= min(count, 5):
                logger.info(f"[QUIZ_SERVICE] Successfully generated {len(validated_questions)} PDF-grounded questions")
                return validated_questions[:count]

        except Exception as e:
            logger.warning(f"[QUIZ_SERVICE] Chapter quiz generation attempt {attempt} failed: {e}")

    logger.error("[QUIZ_SERVICE] AI chapter quiz generation returned invalid questions or timed out.")
    return []