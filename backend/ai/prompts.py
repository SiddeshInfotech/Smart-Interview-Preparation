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
