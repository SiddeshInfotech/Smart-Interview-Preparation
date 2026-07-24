# Prompt builders shared by the quiz and resume-analysis modules.


def resume_analysis_prompt(resume_text):
    return f"""
    Analyze this resume.

    Extract:
    - candidate_name
    - email
    - role
    - location
    - education
    - experience
    - linkedin
    - github
    - portfolio
    - skills
    - matched_skills
    - missing_skills
    - suggested_next_skills
    - skill_category
    - resume_score
    - summary
    - suggestions

    Resume:
    {resume_text}

    Return ONLY valid JSON.
    Do not use markdown.
    Do not wrap the response in ```json or ```.
    Use exactly these keys:

    {{
      "candidate_name": "",
      "email": "",
      "role": "",
      "location": "",
      "education": "",
      "experience": "",
      "linkedin": "",
      "github": "",
      "portfolio": "",
      "skills": [],
      "matched_skills": [],
      "missing_skills": [],
      "suggested_next_skills": [],
      "skill_category": "",
      "resume_score": 0,
      "summary": "",
      "suggestions": []
    }}
    """

def quiz_generation_prompt(topics, difficulty, count, mode, custom_instruction=""):
    """
    Generate a prompt for Gemini to produce quiz questions.

    Args:
        topics (list): List of topic names.
        difficulty (str): 'Easy', 'Medium', 'Hard'.
        count (int): Number of questions to generate.
        mode (str): 'MCQ', 'Coding Challenge', or 'Mock Interview'.
        custom_instruction (str): Optional extra guidance.

    Returns:
        str: The fully formed prompt.
    """
    topics_str = ", ".join(topics)

    # Mode-specific instructions – each now includes a "hint" field
    if mode == "MCQ":
        format_instruction = """
Each question must have exactly 4 options with one correct answer.
Output format (array of objects):
[
  {{
    "text": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0,   // index of the correct option (0‑based)
    "hint": "a short, helpful clue that points toward the correct answer, but does not reveal it outright",
    "explanation": "brief explanation of the correct answer"
  }}
]
"""
    elif mode == "Coding Challenge":
        format_instruction = """
Each question must be a coding problem (not multiple choice).
Provide a clear problem statement, optional sample input/output, and a hint about the expected approach.
Output format (array of objects):
[
  {{
    "text": "problem statement",
    "options": [],   // empty array
    "correct": 0,    // placeholder, always 0
    "hint": "a nudge about which data structure, algorithm, or technique to consider",
    "explanation": "approach or solution outline"
  }}
]
"""
    else:  # Mock Interview
        format_instruction = """
Each question must be an open‑ended interview question (system design, behavioural, or architecture).
Provide a thought‑provoking question and explain what the interviewer is looking for.
Output format (array of objects):
[
  {{
    "text": "question text",
    "options": [],   // empty array
    "correct": 0,    // placeholder
    "hint": "a suggestion on what aspects to focus on in your answer",
    "explanation": "what the interviewer wants to assess"
  }}
]
"""

    custom = (
        f"Additional instruction: {custom_instruction}" if custom_instruction else ""
    )

    return f"""
Role:
You are an expert technical interviewer.

Task:
Generate {count} {difficulty}-level questions on the following topics: {topics_str}.

Mode: {mode}

{format_instruction}

{custom}

Rules:
- Do not repeat questions.
- Ensure the JSON is valid and contains exactly {count} questions.
- Return ONLY the JSON, no other text.
"""


def coding_challenge_prompt(language, difficulty, custom_instruction=""):
    """
    Generate a prompt for Gemini AI to produce a coding challenge with hint and solution.
    """
    custom = f"Additional guidance: {custom_instruction}" if custom_instruction else ""

    difficulty_rules = {
        "Easy": (
            "CRITICAL DIFFICULTY REQUIREMENT: EASY.\n"
            "- The problem MUST be simple, basic, and suitable for beginners.\n"
            "- Examples of Easy topics: basic loops, simple conditional checks, calculating sums, finding max/min of numbers, checking even/odd, reversing a string, string concatenation.\n"
            "- DO NOT generate complex dynamic programming, graph algorithms (BFS/DFS), complex tree traversals, two pointers, or advanced math.\n"
            "- Keep the problem statement concise, clear, and easy to solve in under 15 lines of code."
        ),
        "Medium": (
            "CRITICAL DIFFICULTY REQUIREMENT: MEDIUM.\n"
            "- The problem should test intermediate problem-solving abilities.\n"
            "- Examples: hash map usage, two pointers, sliding window, binary search, basic recursion, string parsing."
        ),
        "Hard": (
            "CRITICAL DIFFICULTY REQUIREMENT: HARD.\n"
            "- The problem should challenge advanced engineers.\n"
            "- Examples: dynamic programming, graph algorithms, complex data structure manipulation, advanced tree operations."
        )
    }.get(difficulty, f"Generate a problem matching {difficulty} difficulty.")

    return f"""
Role:
You are a senior technical interviewer crafting an interview question.

Task:
Generate 1 coding challenge question specifically tailored for the programming language: {language}.

Target Difficulty Level: {difficulty}

{difficulty_rules}

{custom}

Output Format (JSON Object ONLY):
{{
  "title": "Short descriptive title of the challenge",
  "problem_statement": "Comprehensive problem statement detailing the task requirements, input format, output format, and constraints.",
  "sample_input": "Example input string for standard input (stdin)",
  "sample_output": "Corresponding expected output string for standard output (stdout)",
  "hint": "A clear step-by-step hint explaining the basic logic, algorithm, or approach without revealing the full code.",
  "solution": "Complete, correct reference solution code written in {language} with concise inline comments."
}}

Rules:
- Return ONLY the raw JSON object without markdown formatting, code block backticks (no ```json), or wrapping.
- STRICT COMPLIANCE: If difficulty is Easy, the problem MUST be basic and beginner-friendly.
- Ensure all JSON fields ("title", "problem_statement", "sample_input", "sample_output", "hint", "solution") are present and non-empty.
"""
