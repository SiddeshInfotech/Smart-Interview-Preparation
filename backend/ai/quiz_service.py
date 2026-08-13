"""
OpenRouter integration for adaptive quiz generation.
Provides resilient quiz question generation with multi-model fallbacks, retries,
automatic JSON cleaning, recursive list parsing, and schema validation/repair.
"""

import json
import logging
import time
from typing import Any, Dict, List
from django.core.cache import cache

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
    Generate quiz questions using OpenRouter AI service with fast caching, model fallback,
    automatic JSON cleaning, recursive array extraction, and field validation/repair.
    """
    # Check cache for fast 0ms return if no custom instructions
    topics_key = "_".join(sorted([str(t).lower().strip() for t in topics])) if isinstance(topics, list) else str(topics)
    cache_key = f"practice_quiz_cache_{topics_key}_{difficulty.lower()}_{count}_{mode}"
    if not custom_instruction:
        cached = cache.get(cache_key)
        if cached and isinstance(cached, list) and len(cached) >= min(count, 5):
            logger.info(f"[QuizService] CACHE HIT for practice quiz topics: {topics}")
            return cached[:count]
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


def get_fallback_chapter_quiz_questions(
    chapter_name: str,
    pdf_content: str,
    count: int = 10,
    materials_list: list = None,
) -> List[Dict[str, Any]]:
    """
    Generates fallback chapter quiz questions derived strictly from the supplied PDF text
    when OpenRouter AI service is offline or rate-limited.
    """
    filename = materials_list[0]["filename"] if (materials_list and len(materials_list) > 0) else "Chapter Material PDF"

    # Extract sentences/lines from PDF text for grounding
    lines = [
        line.strip() for line in pdf_content.splitlines()
        if len(line.strip()) > 25
        and not line.startswith("---")
        and not line.startswith("COURSE:")
        and not line.startswith("CHAPTER:")
        and not line.startswith("SOURCE MATERIAL")
        and not line.startswith("CONTENT:")
        and not line.startswith("==")
    ]

    fallback_qs = []
    total_lines = len(lines)
    seen_texts = set()

    for idx in range(count):
        if total_lines > 0:
            target_line = lines[idx % total_lines]
            words = target_line.split()
            topic_phrase = " ".join(words[:6]) if len(words) >= 6 else target_line[:35]

            templates = [
                f"In '{filename}' ({chapter_name}), what key details are provided regarding '{topic_phrase}'?",
                f"Which statement best summarizes the section on '{topic_phrase}' in the {chapter_name} study material?",
                f"According to the {chapter_name} documentation ({filename}), which assertion about '{topic_phrase}' is correct?",
                f"What concept is explicitly highlighted concerning '{topic_phrase}' in {filename}?",
                f"Regarding '{topic_phrase}' in {chapter_name}, which of the following is directly stated in the study text?",
            ]
            q_title = templates[idx % len(templates)]
            correct_opt = target_line[:140].rstrip(".")
            exp_text = f"Directly supported by {filename}: '{target_line[:180]}'."
        else:
            q_title = f"Which core principle is explicitly documented in the {chapter_name} learning material ({filename})?"
            correct_opt = f"Core concepts and implementation guidelines for {chapter_name}."
            exp_text = f"Justified directly by {filename} study material."

        if q_title.lower() in seen_texts:
            q_title = f"{q_title} (Part #{idx + 1})"
        seen_texts.add(q_title.lower())

        fallback_qs.append({
            "text": q_title,
            "options": [
                correct_opt,
                f"Unrelated procedural logic omitted from {chapter_name} notes.",
                f"Deprecated legacy syntax not supported in {chapter_name} material.",
                f"External framework assumption absent from {chapter_name} text."
            ],
            "correct": 0,
            "correct_answer": correct_opt,
            "explanation": exp_text,
            "source_material": filename,
            "source_topic": f"{chapter_name} Section #{idx + 1}",
        })

    return fallback_qs[:count]


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
    Performs OpenRouter AI call across all fallback models, JSON cleaning, schema validation, deduplication, and source traceability.
    """
    import hashlib
    content_hash = hashlib.md5(f"{course_name}_{chapter_name}_{pdf_content[:2000]}_{count}".encode("utf-8")).hexdigest()
    cache_key = f"chap_quiz_cache_{content_hash}"
    cached = cache.get(cache_key)
    if cached and isinstance(cached, list) and len(cached) >= min(count, 5):
        logger.info(f"[QUIZ_SERVICE] CACHE HIT for chapter: {chapter_name}")
        return cached[:count]

    from .prompts import chapter_quiz_generation_prompt

    prompt = chapter_quiz_generation_prompt(
        course_name=course_name,
        chapter_name=chapter_name,
        pdf_content=pdf_content,
        count=count,
        difficulty=difficulty,
    )

    models = openrouter_service.get_models_for_feature("quiz")
    valid_filenames = [m["filename"] for m in materials_list] if (materials_list and isinstance(materials_list, list)) else []
    default_material_name = valid_filenames[0] if valid_filenames else "Chapter Material PDF"

    for selected_model in models:
        for attempt in range(1, 2):
            try:
                raw_text = openrouter_service.chat_with_model(
                    model=selected_model,
                    prompt=prompt,
                    temperature=0.3,
                    max_tokens=1500,
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
                seen_texts = set()

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

                    clean_q_text = str(q_text).strip()
                    if not clean_q_text or clean_q_text.lower() in seen_texts:
                        continue

                    clean_opts = [str(o).strip() for o in opts if str(o).strip()]
                    if len(clean_opts) != 4 or len(set(clean_opts)) < 2:
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

                    matched_mat_name = str(src_mat).strip()
                    if valid_filenames:
                        for fname in valid_filenames:
                            if fname.lower() in matched_mat_name.lower() or matched_mat_name.lower() in fname.lower():
                                matched_mat_name = fname
                                break
                        else:
                            matched_mat_name = default_material_name

                    seen_texts.add(clean_q_text.lower())
                    validated_questions.append({
                        "text": clean_q_text,
                        "options": clean_opts,
                        "correct": final_correct_idx,
                        "correct_answer": final_correct_str,
                        "explanation": str(exp).strip(),
                        "source_material": matched_mat_name,
                        "source_topic": str(src_top).strip(),
                    })

                supported_count = len(validated_questions)
                rejected_count = len(raw_questions) - supported_count
                logger.info(f"[QUIZ] Model '{selected_model}' generated: {len(raw_questions)} raw questions, {supported_count} supported, {rejected_count} rejected")

                if supported_count >= min(count, 5):
                    final_res = validated_questions[:count]
                    cache.set(cache_key, final_res, timeout=7200)
                    return final_res

            except Exception as e:
                logger.warning(f"[QUIZ_SERVICE] Chapter quiz generation attempt {attempt} on model '{selected_model}' failed: {e}")

    logger.warning("[QUIZ_SERVICE] AI models unavailable or returned invalid schema. Returning PDF-grounded fallback questions.")
    return get_fallback_chapter_quiz_questions(chapter_name=chapter_name, pdf_content=pdf_content, count=count, materials_list=materials_list)