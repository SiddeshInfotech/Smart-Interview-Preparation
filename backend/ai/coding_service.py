"""OpenRouter integration for coding challenge generation and evaluation."""

import json
from typing import Dict, Any
from .openrouter_service import openrouter_service
from .prompts import coding_challenge_prompt, code_evaluation_prompt


def generate_coding_question(
    language: str,
    difficulty: str = "Medium",
    custom_instruction: str = ""
) -> Dict[str, Any]:
    """
    Generate a coding challenge tailored to language and difficulty using OpenRouter AI.
    """
    prompt = coding_challenge_prompt(
        language=language,
        difficulty=difficulty,
        custom_instruction=custom_instruction
    )

    raw_text = openrouter_service.chat(
        prompt=prompt,
        feature="coding",
        temperature=0.7,
        max_tokens=2500,
        expect_json=True
    )

    cleaned_text = openrouter_service.clean_json_string(raw_text)
    return json.loads(cleaned_text)


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
    """
    prompt = code_evaluation_prompt(
        language=language,
        problem_title=problem_title,
        problem_statement=problem_statement,
        code=code,
        user_input=user_input,
        execution_output=execution_output,
        execution_error=execution_error
    )

    raw_text = openrouter_service.chat(
        prompt=prompt,
        feature="coding",
        temperature=0.3,
        max_tokens=2500,
        expect_json=True
    )

    cleaned_text = openrouter_service.clean_json_string(raw_text)
    return json.loads(cleaned_text)
