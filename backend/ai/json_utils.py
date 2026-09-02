"""
JSON Utility Module for AI Responses.
Provides robust JSON cleaning, recursive array extraction, schema validation,
and automatic repair for quiz questions.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


def clean_json_string(raw_text: str) -> str:
    """
    Clean and extract valid JSON string from raw model text.
    Handles:
    - ```json ... ``` and ``` ... ``` wrappers
    - Leading / trailing text before/after JSON
    - Trailing commas before closing brackets/braces
    - Whitespace normalization
    """
    if not isinstance(raw_text, str) or not raw_text.strip():
        return ""

    text = raw_text.strip()

    # Step 1: Remove markdown code block wrappers if present
    code_block_match = re.search(r"```(?:json)?\s*(.*?)\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    if code_block_match:
        text = code_block_match.group(1).strip()

    # Step 2: If text still doesn't start with { or [, isolate JSON boundaries
    if not (text.startswith("{") or text.startswith("[")):
        first_bracket = min(
            [pos for pos in (text.find("["), text.find("{")) if pos != -1],
            default=-1,
        )
        if first_bracket != -1:
            last_bracket = max(text.rfind("]"), text.rfind("}"))
            if last_bracket > first_bracket:
                text = text[first_bracket : last_bracket + 1].strip()

    # Step 3: Repair trailing commas before closing ] or }
    text = re.sub(r",\s*([\]}])", r"\1", text)

    return text


def parse_json_robust(cleaned_text: str) -> Any:
    """
    Parse JSON string with automatic error recovery for unterminated strings,
    unescaped control characters (newlines/tabs in string literals), and truncated quotes/brackets.
    """
    if not cleaned_text or not isinstance(cleaned_text, str) or not cleaned_text.strip():
        raise ValueError("JSON input text is empty.")

    text = cleaned_text.strip()

    # Attempt 1: json.loads with strict=False (allows raw newlines/tabs inside string values)
    try:
        return json.loads(text, strict=False)
    except Exception:
        pass

    # Attempt 2: Escape raw unescaped newlines inside string literals
    def _escape_newlines(s: str) -> str:
        in_str = False
        esc = False
        out = []
        for ch in s:
            if ch == '"' and not esc:
                in_str = not in_str
                out.append(ch)
            elif ch == '\\' and not esc:
                esc = True
                out.append(ch)
            elif in_str and ch == '\n':
                out.append('\\n')
                esc = False
            elif in_str and ch == '\r':
                esc = False
            else:
                out.append(ch)
                esc = False
        return "".join(out)

    repaired = _escape_newlines(text)
    try:
        return json.loads(repaired, strict=False)
    except Exception:
        pass

    # Attempt 3: Auto-close unterminated quotes or missing braces if LLM output truncated
    for suffix in ['"', '"}', '"}]', '}', ']']:
        try:
            return json.loads(repaired + suffix, strict=False)
        except Exception:
            pass

    # Final attempt: standard json.loads to raise informative Exception
    return json.loads(text)


def extract_questions_list(parsed_data: Any) -> Tuple[Optional[List[Dict[str, Any]]], str]:
    """
    Recursively find the first valid list of question objects inside parsed JSON structure.

    Supports:
    - Direct list: [...]
    - Object wrappers: {"questions": [...]}, {"quiz": [...]}, {"data": [...]}, {"result": [...]}, {"items": [...]}
    - Index dicts: {"0": {...}, "1": {...}}
    - Deeply nested objects/lists.

    Returns:
        Tuple[Optional[List[Dict[str, Any]]], str]: (extracted_list, extraction_method_description)
    """
    if isinstance(parsed_data, list):
        if _is_question_list(parsed_data):
            return parsed_data, "direct_list"
        # Search elements if list contains wrapped dicts
        for idx, item in enumerate(parsed_data):
            if isinstance(item, dict):
                res, method = extract_questions_list(item)
                if res:
                    return res, f"list_element_{idx}->{method}"
        return None, "failed"

    if isinstance(parsed_data, dict):
        # 1. Priority check for common keys
        candidate_keys = ["questions", "quiz", "data", "result", "results", "items", "mcq", "list"]
        for key in candidate_keys:
            val = parsed_data.get(key)
            if isinstance(val, list) and _is_question_list(val):
                return val, f"wrapper_key_{key}"

        # 2. Check if dict values are indexed questions e.g. {"0": {...}, "1": {...}}
        dict_values = list(parsed_data.values())
        if dict_values and all(isinstance(v, dict) for v in dict_values):
            if _is_question_list(dict_values):
                return dict_values, "indexed_dict_values"

        # 3. Recursive search across all dictionary values
        queue = [(parsed_data, "root")]
        visited = set()

        while queue:
            curr_obj, path = queue.pop(0)
            curr_id = id(curr_obj)
            if curr_id in visited:
                continue
            visited.add(curr_id)

            if isinstance(curr_obj, dict):
                for k, v in curr_obj.items():
                    sub_path = f"{path}.{k}"
                    if isinstance(v, list) and _is_question_list(v):
                        return v, f"recursive_path_{sub_path}"
                    elif isinstance(v, (dict, list)):
                        queue.append((v, sub_path))

        # 4. Check if parsed_data itself is a single question object
        keys = {k.lower() for k in parsed_data.keys()}
        if any(k in keys for k in ("text", "question", "prompt", "title", "problem")):
            return [parsed_data], "single_question_object"

    return None, "failed"


def _is_question_list(lst: List[Any]) -> bool:
    """Check if a list contains dictionary objects that resemble question items."""
    if not lst or not isinstance(lst, list):
        return False
    for item in lst:
        if isinstance(item, dict):
            keys = {k.lower() for k in item.keys()}
            if any(k in keys for k in ("text", "question", "prompt", "title", "problem", "options", "q", "content", "query", "mcq")):
                return True
            if len(item) >= 2:
                return True
    return False


def validate_and_repair_question(
    question: Any, mode: str = "MCQ"
) -> Tuple[Dict[str, Any], bool]:
    """
    Validate every generated question item and attempt automatic repair if fields are missing or malformed.

    Rules:
    - Every question MUST contain: text, options, correct, hint, explanation
    - MCQ: exactly 4 options (strings), correct is integer between 0 and 3.

    Returns:
        Tuple[Dict[str, Any], bool]: (normalized_question, repair_was_performed)
    """
    if not isinstance(question, dict):
        raise ValueError(f"Question item must be a dictionary, got {type(question).__name__}")

    repair_performed = False

    # 1. Normalize 'text'
    text_val = None
    for key in ("text", "question", "prompt", "title", "problem", "statement", "q", "content", "query"):
        if key in question and isinstance(question[key], str) and question[key].strip():
            text_val = question[key].strip()
            if key != "text":
                repair_performed = True
            break

    if not text_val:
        raise ValueError("Question missing required non-empty string field 'text'")

    # 2. Normalize 'hint'
    hint_val = None
    for key in ("hint", "clue", "suggestion"):
        if key in question and isinstance(question[key], str) and question[key].strip():
            hint_val = question[key].strip()
            break
    if not hint_val:
        hint_val = "Consider the core principles and key requirements of the question."
        repair_performed = True

    # 3. Normalize 'explanation'
    exp_val = None
    for key in ("explanation", "reason", "rationale", "solution"):
        if key in question and isinstance(question[key], str) and question[key].strip():
            exp_val = question[key].strip()
            break
    if not exp_val:
        exp_val = "Review the problem statement and standard topic documentation for details."
        repair_performed = True

    # 4. Mode-specific handling for 'options' and 'correct'
    is_mcq = (mode == "MCQ")

    if is_mcq:
        # Extract options
        raw_options = question.get("options")
        if not isinstance(raw_options, list):
            raw_options = question.get("choices") or question.get("answers") or question.get("mcq_options") or []
            repair_performed = True

        str_options = [str(opt).strip() for opt in raw_options if str(opt).strip()]

        if len(str_options) == 4:
            final_options = str_options
        elif len(str_options) > 4:
            final_options = str_options[:4]
            repair_performed = True
        elif 2 <= len(str_options) < 4:
            final_options = str_options
            fillers = ["None of the above", "All of the above", "Both A and B", "Cannot be determined"]
            for filler in fillers:
                if filler not in final_options:
                    final_options.append(filler)
                if len(final_options) == 4:
                    break
            repair_performed = True
        else:
            raise ValueError(f"MCQ mode requires at least 2 valid options, got {len(str_options)}")

        # Extract correct answer index
        raw_correct = question.get("correct")
        if raw_correct is None:
            raw_correct = question.get("correct_answer")
        if raw_correct is None:
            raw_correct = question.get("correctIndex")
        if raw_correct is None:
            raw_correct = question.get("answer")

        final_correct = 0
        if isinstance(raw_correct, int) and 0 <= raw_correct < len(final_options):
            final_correct = raw_correct
        elif isinstance(raw_correct, str):
            clean_correct = raw_correct.strip()
            if clean_correct.isdigit():
                val = int(clean_correct)
                if 0 <= val < len(final_options):
                    final_correct = val
                    repair_performed = True
            elif clean_correct.upper() in ("A", "B", "C", "D"):
                mapping = {"A": 0, "B": 1, "C": 2, "D": 3}
                final_correct = mapping[clean_correct.upper()]
                repair_performed = True
            elif clean_correct in final_options:
                final_correct = final_options.index(clean_correct)
                repair_performed = True
            else:
                final_correct = 0
                repair_performed = True
        else:
            final_correct = 0
            repair_performed = True

    else:
        # Open/Non-MCQ questions
        raw_options = question.get("options")
        if raw_options != []:
            repair_performed = True
        final_options = []

        raw_correct = question.get("correct")
        if raw_correct != 0:
            repair_performed = True
        final_correct = 0

    return {
        "text": text_val,
        "options": final_options,
        "correct": final_correct,
        "hint": hint_val,
        "explanation": exp_val,
    }, repair_performed
