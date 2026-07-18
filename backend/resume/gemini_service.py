import json
import re
import google.generativeai as genai
from django.conf import settings


# Configure Gemini API
genai.configure(
    api_key=settings.GEMINI_API_KEY
)


def analyze_resume_with_gemini(resume_text):

    try:

        model = genai.GenerativeModel(
             model_name="gemini-3.5-flash"
)

        


        prompt = f"""
You are an expert HR recruiter and resume analyzer.

Analyze the given resume.

Resume Content:
----------------
{resume_text}
----------------


Return ONLY valid JSON.
Do not add markdown.
Do not add ```json.


JSON Format:

{{
    "skills": [
        "Python",
        "Django",
        "MySQL"
    ],

    "resume_score": 85,

    "summary": "Short resume summary",

    "suggestions": [
        "Add more projects",
        "Improve technical skills"
    ]
}}


Instructions:

1. Extract technical skills.
2. Extract programming languages, frameworks and tools.
3. Give resume score between 0 to 100.
4. Provide improvement suggestions.
5. Provide short professional summary.
"""


        response = model.generate_content(
            prompt
        )


        if not response.text:

            return {
                "skills": [],
                "resume_score": 0,
                "summary": "",
                "suggestions": [
                    "Empty response from Gemini"
                ]
            }


        result = response.text.strip()


        # Remove markdown if Gemini adds it
        result = re.sub(
            r"```json|```",
            "",
            result
        ).strip()


        data = json.loads(
            result
        )


        return {

            "skills": data.get(
                "skills",
                []
            ),

            "resume_score": data.get(
                "resume_score",
                0
            ),

            "summary": data.get(
                "summary",
                ""
            ),

            "suggestions": data.get(
                "suggestions",
                []
            )

        }


    except json.JSONDecodeError:

        return {

            "skills": [],

            "resume_score": 0,

            "summary": "",

            "suggestions": [
                "Gemini response JSON format error"
            ]

        }


    except Exception as e:

        return {

            "skills": [],

            "resume_score": 0,

            "summary": "",

            "suggestions": [
                str(e)
            ]

        }