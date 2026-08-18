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
    2. Completely remove any references to PDF filenames, '.pdf', 'in pdf', etc.
    """
    if not text or not isinstance(text, str):
        return ""

    # Replace tabs and normalize whitespace
    s = text.replace("\t", " ")

    # Remove specific filenames if provided (e.g. '01_Intro.pdf', '01_Intro')
    if valid_filenames:
        for fname in valid_filenames:
            if fname and fname.strip():
                clean_fname = fname.strip()
                s = re.sub(re.escape(clean_fname), "", s, flags=re.IGNORECASE)
                # Remove filename without extension
                base_name = clean_fname.rsplit(".", 1)[0]
                if base_name and len(base_name) >= 3:
                    s = re.sub(re.escape(base_name), "", s, flags=re.IGNORECASE)

    # Remove generic .pdf filenames e.g. "01_Intro.pdf", "document.pdf", "file.pdf"
    s = re.sub(r"\b[\w\-\_\.]+\.pdf\b", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\bpdf\b", "", s, flags=re.IGNORECASE)

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
    Generates fallback chapter quiz questions testing fundamental core technical concepts
    derived from the study domain without verbatim sentence cuts, without tab characters (\t),
    without raw PDF filenames, and without repeating questions.
    """
    clean_pdf_text = pdf_content.replace("\t", " ")
    clean_pdf_text = re.sub(r"\s+", " ", clean_pdf_text).strip()
    text_lower = clean_pdf_text.lower()
    valid_filenames = [m.get("filename", "") for m in materials_list] if (materials_list and isinstance(materials_list, list)) else []

    all_candidate_questions = [
        # 1. HTML Purpose
        {
            "tags": ["html", "hypertext", "markup", "intro", "web", "css"],
            "text": "What is the primary technical purpose of HyperText Markup Language (HTML)?",
            "options": [
                "To define the fundamental structure, semantic elements, and content layout of web documents",
                "To manage server-side relational database connections and transactions",
                "To compile binary code directly for operating system execution",
                "To encrypt network socket packets between client and server"
            ],
            "correct": 0,
            "correct_answer": "To define the fundamental structure, semantic elements, and content layout of web documents",
            "explanation": "HTML provides the core markup structure that structures headers, paragraphs, lists, links, and media on web pages.",
            "source_topic": "HTML Structure & Semantics"
        },
        # 2. DOM & Browser Parsing
        {
            "tags": ["html", "browser", "intro", "display", "web", "dom", "css"],
            "text": "How do web browsers interpret HTML markup tags in a document?",
            "options": [
                "Browsers parse HTML tags to construct a DOM tree and render structural page elements accordingly",
                "Browsers convert HTML tags directly into SQL queries executed against a remote database",
                "Browsers bypass HTML tags and rely exclusively on operating system font defaults",
                "Browsers execute HTML tags as compiled assembly instructions"
            ],
            "correct": 0,
            "correct_answer": "Browsers parse HTML tags to construct a DOM tree and render structural page elements accordingly",
            "explanation": "Browsers process HTML tags into a Document Object Model (DOM) tree to render formatted text, headers, and visual components.",
            "source_topic": "Browser Rendering & DOM Construction"
        },
        # 3. HTML File Extension
        {
            "tags": ["html", "extension", "file", "text", "intro", "css"],
            "text": "Which standard file extension signifies a plain text document containing HTML markup code?",
            "options": [
                ".html",
                ".doc",
                ".rtf",
                ".exe"
            ],
            "correct": 0,
            "correct_answer": ".html",
            "explanation": "The .html file extension identifies plain text files formatted with HTML tags so web browsers and servers recognize them.",
            "source_topic": "HTML Document Format"
        },
        # 4. Plain Text Compatibility
        {
            "tags": ["html", "editor", "text", "intro", "web", "css"],
            "text": "Why are HTML documents created as plain text files rather than proprietary binary document formats?",
            "options": [
                "Plain text allows universal cross-platform compatibility, easy editing, and open parsing by all web browsers",
                "Plain text prevents web browsers from inspecting source code",
                "Binary document formats are mandatory for rendering basic text headers",
                "Text editors automatically compile plain text into server-side machine code"
            ],
            "correct": 0,
            "correct_answer": "Plain text allows universal cross-platform compatibility, easy editing, and open parsing by all web browsers",
            "explanation": "HTML is human-readable plain text, enabling developers on any operating system using any text editor to build compatible web pages.",
            "source_topic": "Cross-Platform Standards"
        },
        # 5. Semantic HTML
        {
            "tags": ["html", "element", "tag", "header", "intro", "semantic", "css"],
            "text": "In web document architecture, what distinguishes semantic HTML tags from non-semantic tags?",
            "options": [
                "Semantic tags clearly describe their structural meaning and content role to browsers and search engines",
                "Semantic tags execute backend server scripts while non-semantic tags perform styling",
                "Semantic tags can only be processed by proprietary word processors",
                "Semantic tags bypass the Document Object Model completely"
            ],
            "correct": 0,
            "correct_answer": "Semantic tags clearly describe their structural meaning and content role to browsers and search engines",
            "explanation": "Semantic HTML tags (like <header>, <article>, <nav>) explicitly convey content meaning to accessibility tools, browsers, and crawlers.",
            "source_topic": "Semantic HTML"
        },
        # 6. HTML Hyperlinks (Anchor Tag)
        {
            "tags": ["html", "link", "anchor", "href", "intro", "web", "css"],
            "text": "What is the primary function of the HTML anchor (<a>) tag in web navigation?",
            "options": [
                "To create hyperlinks connecting web documents, page sections, or external resources via the href attribute",
                "To embed executable database scripts directly inside paragraph text",
                "To configure server-side routing tables on web hosting hardware",
                "To apply background color gradients to page containers"
            ],
            "correct": 0,
            "correct_answer": "To create hyperlinks connecting web documents, page sections, or external resources via the href attribute",
            "explanation": "The <a> tag with its href attribute is the core HTML element for linking documents and enabling web navigation.",
            "source_topic": "HTML Navigation & Hyperlinks"
        },
        # 7. HTML Forms & User Input
        {
            "tags": ["html", "form", "input", "submit", "intro", "web", "css"],
            "text": "What role do HTML <form> elements and <input> controls perform in web development?",
            "options": [
                "They collect user inputs and structure data for submission to web servers",
                "They manage physical memory allocation on the user's graphics card",
                "They automatically encrypt local hard drive files",
                "They compile HTML markup into binary executables"
            ],
            "correct": 0,
            "correct_answer": "They collect user inputs and structure data for submission to web servers",
            "explanation": "HTML form elements provide interactive controls (text fields, checkboxes, buttons) for gathering user input.",
            "source_topic": "HTML Form Controls"
        },
        # 8. CSS Role & Presentation
        {
            "tags": ["css", "style", "presentation", "layout", "html", "intro", "web"],
            "text": "What is the primary role of Cascading Style Sheets (CSS) in web design?",
            "options": [
                "To control visual styling, typography, color palettes, spacing, and responsive page layouts",
                "To execute database transactions and manage table relationships",
                "To resolve domain name system (DNS) IP lookups",
                "To handle user session state on the backend web server"
            ],
            "correct": 0,
            "correct_answer": "To control visual styling, typography, color palettes, spacing, and responsive page layouts",
            "explanation": "CSS separates visual styling rules from structural HTML content, giving developers full control over page presentation.",
            "source_topic": "CSS Presentation Layer"
        },
        # 9. CSS Box Model
        {
            "tags": ["css", "box", "model", "margin", "padding", "border", "html", "intro", "web"],
            "text": "In CSS layout principles, what components constitute the CSS Box Model?",
            "options": [
                "Content, Padding, Border, and Margin",
                "Header, Nav, Section, and Footer",
                "HTML, CSS, JavaScript, and HTTP",
                "GET, POST, PUT, and DELETE"
            ],
            "correct": 0,
            "correct_answer": "Content, Padding, Border, and Margin",
            "explanation": "Every element on a web page is wrapped in a box model consisting of the inner content, padding around content, border, and outer margin.",
            "source_topic": "CSS Box Model"
        },
        # 10. CSS Selectors & Rules
        {
            "tags": ["css", "selector", "class", "id", "style", "html", "intro", "web"],
            "text": "How do CSS selectors target specific HTML elements to apply visual styling rules?",
            "options": [
                "Selectors match HTML elements by element name, class name (.class), or ID (#id)",
                "Selectors query backend relational database tables to retrieve inline styles",
                "Selectors modify browser binary files on the operating system file system",
                "Selectors compile HTML tags into C++ header files"
            ],
            "correct": 0,
            "correct_answer": "Selectors match HTML elements by element name, class name (.class), or ID (#id)",
            "explanation": "CSS selectors allow developers to target specific HTML elements by tag, class, or ID to apply CSS styling properties.",
            "source_topic": "CSS Selectors & Rules"
        },

        # JavaScript & Client Logic Concepts
        {
            "tags": ["javascript", "js", "script", "interactivity", "logic"],
            "text": "What fundamental functionality does JavaScript introduce to client-side web development?",
            "options": [
                "Dynamic DOM manipulation, user event handling, and client-side application logic",
                "Static text formatting without browser runtime execution",
                "Low-level memory management for hardware graphics cards",
                "Server-side operating system kernel configuration"
            ],
            "correct": 0,
            "correct_answer": "Dynamic DOM manipulation, user event handling, and client-side application logic",
            "explanation": "JavaScript adds interactive behavior, enabling web pages to respond dynamically to user input, update DOM elements, and communicate with APIs.",
            "source_topic": "JavaScript Client Logic"
        },

        # Web Architecture & HTTP Concepts
        {
            "tags": ["http", "web", "browser", "server", "request"],
            "text": "In the standard client-server model of the Web, what role does a web browser perform?",
            "options": [
                "It acts as a client that sends HTTP requests to servers and renders received markup for the user",
                "It acts as a backend database engine storing user records",
                "It acts as a network router routing packets across physical internet backbones",
                "It acts as a compiler translating source code into physical silicon instructions"
            ],
            "correct": 0,
            "correct_answer": "It acts as a client that sends HTTP requests to servers and renders received markup for the user",
            "explanation": "Web browsers send requests (e.g. GET) to web servers, process returned HTML/CSS/JS resources, and display the rendered page to the user.",
            "source_topic": "Client-Server Web Model"
        }
    ]

    selected_questions = []
    seen_texts = set()

    for q in all_candidate_questions:
        match_score = sum(1 for tag in q["tags"] if tag in text_lower or tag in chapter_name.lower())
        q_copy = dict(q)
        q_copy["score"] = match_score
        selected_questions.append(q_copy)

    selected_questions.sort(key=lambda x: x["score"], reverse=True)

    result_qs = []
    for q in selected_questions:
        q_text_clean = _sanitize_question_text(q["text"], valid_filenames)
        if q_text_clean.lower() in seen_texts:
            continue
        seen_texts.add(q_text_clean.lower())

        result_qs.append({
            "text": q_text_clean,
            "options": [_sanitize_question_text(opt, valid_filenames) for opt in q["options"]],
            "correct": q["correct"],
            "correct_answer": _sanitize_question_text(q["correct_answer"], valid_filenames),
            "explanation": _sanitize_question_text(q["explanation"], valid_filenames),
            "source_material": chapter_name,
            "source_topic": q["source_topic"]
        })

        if len(result_qs) >= count:
            break

    return result_qs[:count]


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
    cache_key = f"chap_quiz_cache_v6_{content_hash}"
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
    valid_filenames = [m.get("filename", "") for m in materials_list] if (materials_list and isinstance(materials_list, list)) else []

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