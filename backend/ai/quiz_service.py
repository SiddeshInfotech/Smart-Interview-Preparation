"""
OpenRouter integration for adaptive quiz generation.
Provides resilient quiz question generation with multi-model fallbacks, retries,
automatic JSON cleaning, recursive list parsing, and schema validation/repair.
"""

import json
import logging
import re
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


def _sanitize_question_text(text: str, valid_filenames: list = None) -> str:
    """
    Sanitize question text, options, and explanations:
    1. Replace all tabs (\t) and multiple consecutive spaces with a single space.
    2. Remove any references to PDF filenames (e.g. '01_Intro.pdf', 'chapter1.pdf', etc.).
    """
    if not text or not isinstance(text, str):
        return ""

    # Replace tabs and normalize whitespace
    s = text.replace("\t", " ")

    # Remove specific filenames if provided
    if valid_filenames:
        for fname in valid_filenames:
            if fname and fname.strip():
                s = re.sub(re.escape(fname.strip()), "", s, flags=re.IGNORECASE)

    # Remove generic .pdf filenames e.g. "01_Intro.pdf" or "document.pdf"
    s = re.sub(r"\b[\w\-\_\.]+\.pdf\b", "", s, flags=re.IGNORECASE)

    # Clean up residual empty quotes, parens, or excess spaces
    s = re.sub(r"['\"]{2,}", "", s)
    s = re.sub(r"\(\s*\)", "", s)
    s = re.sub(r"\s+", " ", s).strip()

    return s


def _is_subjective_or_variable_question(q_text: str) -> bool:
    """
    Check if a question asks about subjective, variable, or student-specific choices
    such as arbitrary file names (e.g., homepage file name, default loaded file), variable names in snippets, local paths, etc.
    """
    if not q_text or not isinstance(q_text, str):
        return True

    text_lower = q_text.lower()
    subjective_patterns = [
        r"file\s*name",
        r"filename",
        r"which\s*file\s*is",
        r"what\s*file\s*is",
        r"what\s*is\s*the\s*(exact\s*)?file",
        r"loaded\s*by\s*default",
        r"default\s*file",
        r"default\s*page",
        r"default\s*document",
        r"homepage",
        r"home\s*page",
        r"variable\s*name",
        r"name\s*of\s*(the\s*)?variable",
        r"what\s*did\s*the\s*author\s*name",
        r"in\s*line\s*\d+",
        r"name\s*of\s*(the\s*)?function\s*in\s*example",
        r"what\s*folder\s*name",
        r"directory\s*name",
    ]
    for pattern in subjective_patterns:
        if re.search(pattern, text_lower):
            return True
    return False


def get_fallback_chapter_quiz_questions(
    chapter_name: str,
    pdf_content: str,
    count: int = 10,
    materials_list: list = None,
) -> List[Dict[str, Any]]:
    """
    Generates fallback chapter quiz questions derived strictly from core concepts
    explained in the PDF content without mentioning PDF file names, without tab characters (\t),
    and without sentence-splicing fragments. Ensures fixed, objective correct answers.
    """
    # Clean PDF content: replace tabs and normalize whitespace
    clean_pdf_text = pdf_content.replace("\t", " ")
    clean_pdf_text = re.sub(r"\s+", " ", clean_pdf_text).strip()
    text_lower = clean_pdf_text.lower()

    valid_filenames = [m["filename"] for m in materials_list] if (materials_list and isinstance(materials_list, list)) else []

    concept_questions = []

    # Check for HTML core concepts in PDF text
    if "html" in text_lower or "hypertext" in text_lower:
        concept_questions.append({
            "text": "What does the acronym HTML stand for in web development?",
            "options": [
                "HyperText Markup Language",
                "High Technical Markup Logic",
                "Hyperlink Transfer Protocol Language",
                "Home Tool Management Language"
            ],
            "correct": 0,
            "correct_answer": "HyperText Markup Language",
            "explanation": "HTML stands for HyperText Markup Language, the standard markup language used to structure web pages.",
            "source_material": chapter_name,
            "source_topic": "HTML Fundamentals"
        })

        concept_questions.append({
            "text": "What is the primary function of HTML markup tags in a web document?",
            "options": [
                "To instruct the web browser how to structure and display content",
                "To execute database queries directly on the web server",
                "To encrypt network traffic between client and server",
                "To compile binary machine code for operating system execution"
            ],
            "correct": 0,
            "correct_answer": "To instruct the web browser how to structure and display content",
            "explanation": "HTML tags provide structural instructions that tell web browsers how to format and render elements such as headers, paragraphs, and links.",
            "source_material": chapter_name,
            "source_topic": "HTML Structure & Tags"
        })

        if ".html" in text_lower or "extension" in text_lower:
            concept_questions.append({
                "text": "Which standard file extension designates a plain text document containing HTML markup?",
                "options": [
                    ".html",
                    ".doc",
                    ".rtf",
                    ".exe"
                ],
                "correct": 0,
                "correct_answer": ".html",
                "explanation": "The .html file extension informs the operating system and web browsers that the file contains HTML markup code.",
                "source_material": chapter_name,
                "source_topic": "HTML File Conventions"
            })

        if "text" in text_lower or "editor" in text_lower or "kompozer" in text_lower:
            concept_questions.append({
                "text": "Why can HTML documents be created and edited using plain text editors?",
                "options": [
                    "Because HTML files are fundamentally plain text files containing markup instructions",
                    "Because text editors compile HTML directly into executable binary code",
                    "Because HTML requires proprietary word processing file formats to run",
                    "Because browsers cannot read files saved with markup code"
                ],
                "correct": 0,
                "correct_answer": "Because HTML files are fundamentally plain text files containing markup instructions",
                "explanation": "HTML files consist of plain text code instructions, allowing them to be created and modified using any standard text editor.",
                "source_material": chapter_name,
                "source_topic": "HTML Document Editing"
            })

    # Check for CSS concepts
    if "css" in text_lower or "style" in text_lower:
        concept_questions.append({
            "text": "What is the main role of Cascading Style Sheets (CSS) in web design?",
            "options": [
                "To control the visual presentation, styling, and layout of HTML elements",
                "To manage backend database connections and SQL transactions",
                "To handle server-side authentication tokens",
                "To create low-level operating system drivers"
            ],
            "correct": 0,
            "correct_answer": "To control the visual presentation, styling, and layout of HTML elements",
            "explanation": "CSS defines styling rules (such as colors, fonts, margins, and flexbox/grid layouts) for visual presentation.",
            "source_material": chapter_name,
            "source_topic": "CSS Presentation & Layout"
        })

    # Check for JavaScript concepts
    if "javascript" in text_lower or "js" in text_lower or "script" in text_lower:
        concept_questions.append({
            "text": "What core functionality does JavaScript add to web pages?",
            "options": [
                "Dynamic client-side interactivity, logic, and event handling",
                "Static text formatting without browser execution",
                "Database indexing and physical table partitioning",
                "DNS IP address resolution"
            ],
            "correct": 0,
            "correct_answer": "Dynamic client-side interactivity, logic, and event handling",
            "explanation": "JavaScript enables interactive user behavior, DOM updates, API fetches, and dynamic logic.",
            "source_material": chapter_name,
            "source_topic": "JavaScript Interactivity"
        })

    # Extract additional conceptual statements from clean PDF text if more questions are needed
    lines = [l.strip() for l in clean_pdf_text.split(".") if len(l.strip()) > 25]
    definition_sentences = []

    for line in lines:
        l_lower = line.lower()
        if any(keyword in l_lower for keyword in [" is ", " means ", " refers to ", " allows ", " provides ", " defines ", " used for "]):
            if not any(bad in l_lower for bad in ["index.html", "home.html", "homepage", "for example", "e.g.", ".pdf"]):
                definition_sentences.append(line.strip())

    idx = 0
    while len(concept_questions) < count and idx < len(definition_sentences):
        def_line = definition_sentences[idx]
        idx += 1

        clean_line = _sanitize_question_text(def_line, valid_filenames)
        if len(clean_line) < 20:
            continue

        q_title = f"According to the {chapter_name} study material, which assertion regarding core concepts is correct?"
        correct_opt = clean_line[:120].rstrip(".") + "."

        concept_questions.append({
            "text": q_title,
            "options": [
                correct_opt,
                f"Bypassing standardized execution rules omitted from {chapter_name}.",
                f"Deprecated legacy syntax not supported in {chapter_name}.",
                f"External framework assumptions absent from {chapter_name}."
            ],
            "correct": 0,
            "correct_answer": correct_opt,
            "explanation": f"Grounded in conceptual principles of {chapter_name}.",
            "source_material": chapter_name,
            "source_topic": f"{chapter_name} Core Concept #{len(concept_questions) + 1}"
        })

    # Fill remaining count with domain-tailored concept questions if needed
    generic_templates = [
        (
            f"What is a fundamental requirement for maintaining clean code structure in {chapter_name}?",
            f"Following consistent syntax rules, clear organization, and modular component separation.",
            "Enforces readable, maintainable application architecture."
        ),
        (
            f"Which practice ensures reliability and maintainability when working with {chapter_name}?",
            f"Adhering to standard technical specifications and validating code against conventions.",
            "Validating code against domain specifications prevents runtime errors."
        ),
        (
            f"What is the primary benefit of using standardized frameworks and tools in {chapter_name}?",
            f"They offer proven architectural patterns, improve efficiency, and maintain consistency.",
            "Standard utilities reduce boilerplate code and ensure industry alignment."
        ),
        (
            f"Why is proper error handling and validation important in {chapter_name}?",
            f"It prevents unexpected failures and ensures system resilience under edge cases.",
            "Robust validation catches invalid inputs and protects application integrity."
        ),
    ]

    tmpl_idx = 0
    while len(concept_questions) < count:
        q_text, c_opt, exp = generic_templates[tmpl_idx % len(generic_templates)]
        tmpl_idx += 1
        concept_questions.append({
            "text": q_text,
            "options": [
                c_opt,
                "Ignoring exception handling and omitting error boundaries.",
                "Hardcoding arbitrary local paths without standard conventions.",
                "Disabling compiler and validation checks during execution."
            ],
            "correct": 0,
            "correct_answer": c_opt,
            "explanation": exp,
            "source_material": chapter_name,
            "source_topic": f"{chapter_name} Best Practices #{len(concept_questions)}"
        })

    # Final sanitization pass over all questions to guarantee no tabs or PDF filenames exist
    final_questions = []
    for q in concept_questions[:count]:
        q["text"] = _sanitize_question_text(q["text"], valid_filenames)
        q["options"] = [_sanitize_question_text(opt, valid_filenames) for opt in q["options"]]
        q["correct_answer"] = _sanitize_question_text(q["correct_answer"], valid_filenames)
        q["explanation"] = _sanitize_question_text(q["explanation"], valid_filenames)
        q["source_material"] = chapter_name
        final_questions.append(q)

    return final_questions


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
    cache_key = f"chap_quiz_cache_v4_{content_hash}"
    cached = cache.get(cache_key)
    if cached and isinstance(cached, list) and len(cached) >= min(count, 5):
        valid_cached = []
        for q in cached:
            text = _sanitize_question_text(q.get("text", ""))
            if not _is_subjective_or_variable_question(text):
                valid_cached.append(q)
        if len(valid_cached) >= min(count, 5):
            logger.info(f"[QUIZ_SERVICE] CACHE HIT for chapter: {chapter_name}")
            return valid_cached[:count]

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

    # Fast primary model attempt to prevent multi-model fallback timeout delays
    primary_models = models[:1] if models else ["google/gemini-2.0-flash-01"]

    for selected_model in primary_models:
        try:
            raw_text = openrouter_service.chat_with_model(
                model=selected_model,
                prompt=prompt,
                temperature=0.3,
                max_tokens=1000,
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
                src_top = item.get("source_topic") or f"{chapter_name} Concepts"

                if not q_text or not isinstance(opts, list) or len(opts) != 4:
                    continue

                clean_q_text = _sanitize_question_text(str(q_text), valid_filenames)
                if not clean_q_text or clean_q_text.lower() in seen_texts:
                    continue

                if _is_subjective_or_variable_question(clean_q_text):
                    logger.warning(f"[QUIZ] Rejecting question testing subjective/variable details: '{clean_q_text}'")
                    continue

                clean_opts = [_sanitize_question_text(str(o), valid_filenames) for o in opts if str(o).strip()]
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

                seen_texts.add(clean_q_text.lower())
                validated_questions.append({
                    "text": clean_q_text,
                    "options": clean_opts,
                    "correct": final_correct_idx,
                    "correct_answer": final_correct_str,
                    "explanation": _sanitize_question_text(str(exp), valid_filenames),
                    "source_material": chapter_name,
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
            logger.warning(f"[QUIZ_SERVICE] Fast AI chapter quiz attempt on '{selected_model}' failed/timed out: {e}")

    logger.warning("[QUIZ_SERVICE] AI models unavailable or timed out. Serving fast PDF-grounded concept fallback questions.")
    fallback_res = get_fallback_chapter_quiz_questions(chapter_name=chapter_name, pdf_content=pdf_content, count=count, materials_list=materials_list)
    if fallback_res:
        cache.set(cache_key, fallback_res, timeout=7200)
    return fallback_res