"""
Prompt builders shared by AI generation services.
Provides strict system prompts for quiz generation, resume analysis, coding challenges, and code evaluation.
"""

from typing import List


def resume_analysis_prompt(resume_text: str, target_domain: str = "") -> str:
    """
    Generate strict prompt for resume analysis.
    Forces JSON output synchronized with ResumeUpload.jsx frontend fields and backend ResumeAnalysis model.
    Incorporate domain matching evaluation if target_domain is specified.
    """
    domain_instructions = ""
    if target_domain and target_domain.strip():
        domain_instructions = f"""
ESSENTIAL DOMAIN MATCHING & SCORE FORCING CRITERIA:
- The candidate's selected Target Career Domain is: "{target_domain.strip()}"
- You MUST strictly evaluate whether the candidate's skills, projects, tools, experience, and overall resume content match this Target Career Domain ("{target_domain.strip()}").
- Calculate a "domain_match_score" (0-100) specifically measuring domain alignment.
- Set "domain_match_status": true if domain_match_score >= 60, otherwise false.
- Provide "domain_match_feedback": A concise 1-2 sentence assessment explaining whether the resume aligns with the target domain or if there is a domain mismatch (e.g., candidate selected Full Stack Web Development but uploaded a Graphic Design, Civil Engineering, or Marketing resume).
- STRICT SCORE RULE: If ANY details in the candidate's resume do NOT match the selected target domain ("{target_domain.strip()}") or if there is a domain mismatch (domain_match_score < 60), YOU MUST FORCE THE OVERALL "resume_score" TO EXACTLY 0.
"""
    else:
        domain_instructions = """
ESSENTIAL DOMAIN MATCHING CRITERIA:
- Evaluate candidate's primary domain based on extracted skills and experience.
- Set "domain_match_score": 80, "domain_match_status": true, "domain_match_feedback": "Resume domain aligned with primary technical skills."
"""

    clean_domain = target_domain.strip() if target_domain else ""

    return f"""You are an expert ATS (Applicant Tracking System) reviewer, Lead Technical Recruiter, and Resume Strategist.

Analyze the following resume text and provide a thorough, structured evaluation.

RESUME TEXT:
{resume_text}

{domain_instructions}

CRITICAL RULES:
1. Return ONLY a single raw valid JSON object.
2. Do NOT use markdown fences (NO ```json or ```).
3. Do NOT include any preamble, intro, commentary, or outro text outside the JSON structure.
4. Output MUST match the exact JSON schema defined below.

REQUIRED JSON SCHEMA:
{{
  "candidate_name": "Full Name of candidate or 'Candidate'",
  "email": "Email address or '' if not found",
  "role": "Primary target role or current designation (e.g. Full Stack Web Developer)",
  "location": "City, Country or 'Remote'",
  "education": "Highest degree, field of study, and university/college",
  "experience": "Total experience summary (e.g. 3 years or Entry Level)",
  "linkedin": "LinkedIn profile URL or '' if not found",
  "github": "GitHub profile URL or '' if not found",
  "portfolio": "Portfolio or personal website URL or '' if not found",
  "target_domain": "{clean_domain}",
  "domain_match_score": 85,
  "domain_match_status": true,
  "domain_match_feedback": "Concise 1-2 sentence feedback on domain relevance",
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "matched_skills": ["Matched Skill 1", "Matched Skill 2"],
  "missing_skills": ["Missing Skill 1", "Missing Skill 2"],
  "suggested_next_skills": ["Suggested Skill 1", "Suggested Skill 2"],
  "skill_category": "Primary technical domain (e.g. Full Stack Web Development)",
  "resume_score": 82,
  "summary": "2-3 sentence executive professional summary highlighting candidate strengths and domain expertise.",
  "suggestions": [
    "First actionable advice focusing on project links and live portfolio work",
    "Second actionable advice focusing on experience framing and quantifiable metric achievements",
    "Third actionable advice focusing on technical architecture, system design, or domain depth"
  ]
}}

Begin JSON output now:"""


def quiz_generation_prompt(
    topics: List[str],
    difficulty: str,
    count: int,
    mode: str,
    custom_instruction: str = "",
    personalization_context: dict = None
) -> str:
    """
    Generate strict prompt for OpenRouter quiz question generation.
    Forces raw JSON array, forbids markdown formatting and preamble/postamble text.
    Incorporate candidate domain, profile skills, optional resume details, and performance.
    """
    topics_str = ", ".join(topics) if isinstance(topics, list) else str(topics)

    context_details = []
    if personalization_context:
        domain = personalization_context.get("domain")
        if domain:
            context_details.append(f"- Candidate Career Domain: {domain}")
        exp = personalization_context.get("experience_years")
        if exp is not None:
            context_details.append(f"- Experience: {exp} years")
        prof_skills = personalization_context.get("profile_skills", [])
        if prof_skills:
            context_details.append(f"- Profile Skills: {', '.join(prof_skills)}")
        if personalization_context.get("resume_available"):
            res_skills = personalization_context.get("resume_skills", [])
            if res_skills:
                context_details.append(f"- Resume Skills: {', '.join(res_skills)}")
            res_role = personalization_context.get("resume_role")
            if res_role:
                context_details.append(f"- Resume Target Role: {res_role}")
        quiz_avg = personalization_context.get("quiz_avg_score", 0)
        if quiz_avg > 0:
            context_details.append(f"- Historical Quiz Average Score: {quiz_avg}%")

    context_str = "\n".join(context_details) if context_details else "- Context: Standard candidate preparation"

    if mode == "MCQ":
        mode_rules = (
            '- Each question MUST have "options" containing EXACTLY 4 non-empty string choices: '
            '["Option A", "Option B", "Option C", "Option D"].\n'
            '- "correct" MUST be an integer between 0 and 3 representing the 0-based index of the correct option.'
        )
        schema_example = """[
  {
    "text": "Clear and accurate question statement",
    "options": [
      "Option A text",
      "Option B text",
      "Option C text",
      "Option D text"
    ],
    "correct": 0,
    "hint": "Helpful hint guiding candidate without revealing the answer",
    "explanation": "Clear explanation of why option index 0 is correct"
  }
]"""
    elif mode == "Coding Challenge":
        mode_rules = (
            '- "options" MUST be an empty array [].\n'
            '- "correct" MUST be 0.\n'
            '- "text" MUST present a comprehensive coding problem statement with input/output requirements.\n'
            '- "hint" MUST provide an algorithmic or data structure suggestion.\n'
            '- "explanation" MUST outline the expected solution strategy.'
        )
        schema_example = """[
  {
    "text": "Coding problem statement with requirements and sample I/O",
    "options": [],
    "correct": 0,
    "hint": "Nudge regarding data structures or algorithmic technique",
    "explanation": "Step-by-step optimal approach and solution breakdown"
  }
]"""
    else:  # Mock Interview or default
        mode_rules = (
            '- "options" MUST be an empty array [].\n'
            '- "correct" MUST be 0.\n'
            '- "text" MUST present a scenario or open-ended technical/architectural interview question.\n'
            '- "hint" MUST suggest key aspects or concepts to address in response.\n'
            '- "explanation" MUST detail what the interviewer is evaluating.'
        )
        schema_example = """[
  {
    "text": "Technical or architectural interview question",
    "options": [],
    "correct": 0,
    "hint": "Key architectural or technical considerations to cover",
    "explanation": "Interviewer evaluation criteria and ideal response structure"
  }
]"""

    custom = (
        f"\nUser Additional Instructions:\n{custom_instruction.strip()}"
        if custom_instruction and custom_instruction.strip()
        else ""
    )

    return f"""You are an elite technical interviewer and domain expert.

TASK:
Generate EXACTLY {count} unique, non-repetitive, high-quality assessment questions tailored to the candidate's career domain and profile context.

CANDIDATE PERSONALIZATION CONTEXT:
{context_str}

PARAMETERS:
- Primary Topics: {topics_str}
- Target Internal Complexity Level: {difficulty}
- Assessment Mode: {mode}
{custom}

CRITICAL RULES - STRICT ENFORCEMENT:
1. JSON ONLY: Your output MUST be ONLY a valid raw JSON array containing EXACTLY {count} question objects.
2. NO MARKDOWN: Do NOT wrap the JSON inside markdown code block fences (NO ```json or ```).
3. NO EXPLANATORY TEXT: Do NOT include any intro, preamble, commentary, or outro outside the JSON structure.
4. EXACT BOUNDARIES: The FIRST character of your response MUST be '[' and the LAST character MUST be ']'.
5. REQUIRED FIELDS: Every question object MUST contain ALL 5 of these exact keys:
   - "text" (non-empty string)
   - "options" (list of strings)
   - "correct" (integer)
   - "hint" (non-empty string)
   - "explanation" (non-empty string)

MODE-SPECIFIC SCHEMAS:
{mode_rules}

SCHEMA TEMPLATE:
{schema_example}

Begin output now:"""


def coding_challenge_prompt(
    language: str,
    difficulty: str,
    custom_instruction: str = "",
    personalization_context: dict = None
) -> str:
    """
    Generate a prompt for AI to produce a coding challenge with hint and solution,
    tailored to the candidate's career domain and skill level.
    """
    custom = f"Additional guidance: {custom_instruction}" if custom_instruction else ""

    context_details = []
    if personalization_context:
        domain = personalization_context.get("domain")
        if domain:
            context_details.append(f"- Candidate Career Domain: {domain}")
        exp = personalization_context.get("experience_years")
        if exp is not None:
            context_details.append(f"- Experience: {exp} years")
        prof_skills = personalization_context.get("profile_skills", [])
        if prof_skills:
            context_details.append(f"- Profile Skills: {', '.join(prof_skills)}")
        if personalization_context.get("resume_available"):
            res_skills = personalization_context.get("resume_skills", [])
            if res_skills:
                context_details.append(f"- Resume Skills: {', '.join(res_skills)}")

    context_str = "\n".join(context_details) if context_details else "- Context: Standard candidate preparation"

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

    # Technology-specific instructions for UI, SQL, & Testing domains
    tech_instructions = ""
    lang_lower = (language or "").lower()
    
    if "html" in lang_lower or "css" in lang_lower:
        tech_instructions = """
TECHNOLOGY-SPECIFIC MANDATE FOR HTML & CSS:
- The challenge MUST BE SPECIFIC TO HTML elements, CSS styling, flexbox/grid layouts, form styling, responsive UI cards, or CSS selectors/animations.
- DO NOT generate integer sum, algorithmic loops, mathematical logic, or CLI input reading problems, as HTML & CSS are UI layout technologies!
- "sample_input": Describe the target UI component or DOM requirement (e.g. "Create a responsive flexbox card with centered title and styled action button").
- "sample_output": Describe the expected rendered DOM elements or CSS properties (e.g. "<div class='card'> with display: flex; justify-content: center;").
- "solution": Provide complete, valid HTML code containing embedded CSS <style> rules or inline styling demonstrating the solution.
"""
    elif "react" in lang_lower:
        tech_instructions = """
TECHNOLOGY-SPECIFIC MANDATE FOR REACT JS:
- The challenge MUST BE SPECIFIC TO React components, state/props management, JSX structure, event handlers, or hooks (useState, useEffect).
- DO NOT generate basic CLI input/output integer math. Focus on UI component state, interactive counters, dynamic list rendering, or form inputs.
- "solution": Provide complete, working React JSX component code.
"""
    elif "sql" in lang_lower:
        tech_instructions = """
TECHNOLOGY-SPECIFIC MANDATE FOR SQL:
- The challenge MUST BE SPECIFIC TO SQL database querying (e.g. SELECT statements, JOINs, GROUP BY, HAVING, WHERE filtering, or DDL/DML table operations).
- "sample_input": Define the table schema and sample data rows.
- "sample_output": Define the expected tabular query output.
- "solution": Provide the exact, correct SQL query string.
"""
    elif "testing" in lang_lower or "pytest" in lang_lower:
        tech_instructions = """
TECHNOLOGY-SPECIFIC MANDATE FOR SOFTWARE TESTING:
- The challenge MUST BE SPECIFIC TO writing test cases, Pytest assertions, unit testing functions, or testing edge cases.
- "solution": Provide complete Python code using pytest or unittest with test functions and assertions.
"""

    return f"""
Role:
You are a senior technical interviewer crafting an interview question.

Task:
Generate 1 coding challenge question specifically tailored for the programming language: {language} and aligned with the candidate's career domain.

CANDIDATE PERSONALIZATION CONTEXT:
{context_str}

Target Internal Difficulty Level: {difficulty}

{difficulty_rules}

{tech_instructions}

{custom}

Output Format (JSON Object ONLY):
{{
  "title": "Short descriptive title of the challenge",
  "problem_statement": "Comprehensive problem statement detailing the task requirements, input format, output format, and constraints.",
  "sample_input": "Example input string for standard input (stdin) or UI component requirement",
  "sample_output": "Corresponding expected output string for standard output (stdout) or expected DOM element layout",
  "hint": "A clear step-by-step hint explaining the basic logic, algorithm, layout approach, or syntax without revealing the full code.",
  "solution": "Complete, correct, executable reference solution code written in {language} with concise inline comments."
}}

CRITICAL COMPLETENESS RULES:
1. NON-EMPTY SAMPLE OUTPUT: "sample_output" MUST BE NON-EMPTY and contain the exact expected output matching "sample_input".
2. FULL UNTRUNCATED SOLUTION: "solution" MUST BE A COMPLETE, FULLY WRITTEN, WORKING REFERENCE SOLUTION in {language}. DO NOT TRUNCATE, stop midway, or leave unassigned variables.
3. Return ONLY the raw JSON object without markdown formatting, code block backticks (no ```json), or wrapping.
4. Ensure all JSON fields ("title", "problem_statement", "sample_input", "sample_output", "hint", "solution") are present and non-empty.
"""


def code_evaluation_prompt(
    language: str,
    problem_title: str,
    problem_statement: str,
    code: str,
    user_input: str,
    execution_output: str,
    execution_error: str
) -> str:
    """
    Generate a prompt for AI to evaluate candidate code submission.
    """
    return f"""
Role:
You are an expert Lead Software Architect and Technical Interviewer evaluating a candidate's code submission.

Task:
Evaluate the candidate's code submission based on the problem requirements, execution results, and software engineering best practices across multiple criteria.

Context:
- Language: {language}
- Problem Title: {problem_title}
- Problem Statement: {problem_statement}
- Submitted Code:
```
{code}
```
- User Standard Input (stdin):
{user_input if user_input else "(None)"}
- Program Output (stdout):
{execution_output if execution_output else "(None)"}
- Execution Error (stderr/error):
{execution_error if execution_error else "(None)"}

CRITICAL EVALUATION & SCORING RULES:
1. COMPLETELY IRRELEVANT / GENERIC CODE (0% - 5% Score):
   - If the submitted code has NO relation to the problem statement (e.g. submitting `print("Hello World")`, boilerplate, or unrelated code for an addition, sorting, or graph problem), set `overall_score` to 0, `status` to "Failed", `logical_thinking` to 0, and `problem_solving` to 0. Do NOT award high scores just because the code compiled without runtime errors.

2. SLIGHT MATCH / INCOMPLETE SOLUTION (10% - 20% Score):
   - If the user's code shows a slight match or partial effort toward the problem (e.g., defining `a = 10, b = 20` for a number addition problem, but failing to read dynamic input, compute result, or produce expected output), award ONLY 10% to 20% score (`overall_score` between 10 and 20).

3. VALID ALTERNATIVE SOLUTIONS (High Score 80% - 100%):
   - Do NOT penalize the user if their solution uses a different valid approach, algorithm, library, or coding style than the expected solution, provided it correctly solves the problem requirements and no specific method was mandated by the problem statement.
   - If the code correctly solves the problem, award high correctness (85-100%). Score variations should be based on efficiency (time/space complexity), code quality, and edge case handling.

Evaluation Criteria:
1. Correctness: Does the code fulfill the problem requirement and produce correct output? (0-100)
2. Code Quality & Style: Is the code well-structured, readable, and following idiomatic conventions? (0-100)
3. Time Complexity: What is the time complexity (e.g. O(N), O(N^2)) and performance efficiency score? (0-100)
4. Space Complexity: What is the space complexity (e.g. O(1), O(N)) and memory usage score? (0-100)
5. Edge Cases: Does the code handle potential edge cases or boundary conditions properly? (0-100)

Output Format (JSON Object ONLY):
{{
  "overall_score": 85,
  "status": "Passed",
  "logical_thinking": 90,
  "code_efficiency": 85,
  "language_skills": 88,
  "problem_solving": 86,
  "time_complexity_notation": "O(N)",
  "space_complexity_notation": "O(1)",
  "criteria": {{
    "correctness": {{ "score": 90, "feedback": "Detailed feedback on output correctness" }},
    "code_quality": {{ "score": 85, "feedback": "Feedback on code structure and readability" }},
    "time_complexity": {{ "score": 85, "feedback": "Assessment of time complexity" }},
    "space_complexity": {{ "score": 90, "feedback": "Assessment of memory usage" }},
    "edge_cases": {{ "score": 75, "feedback": "Assessment of boundary/edge case handling" }}
  }},
  "summary": "2-3 sentences summarizing the candidate's code quality and performance.",
  "suggestions": [
    "First actionable improvement suggestion",
    "Second actionable improvement suggestion"
  ]
}}

Rules:
- Return ONLY valid raw JSON object without markdown formatting, code block backticks (no ```json), or wrapping.
- All numbers must be integers. Ensure all keys are present.
"""
