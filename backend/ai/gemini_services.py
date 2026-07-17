from google import genai
from google.genai.errors import APIError
from django.conf import settings

# Initialize Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Models in priority order
MODELS = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.0-flash",
]


def generate_content(prompt):
    """
    Generates content using the first available Gemini model.
    Automatically falls back if a model is unavailable.
    """

    last_error = None

    for model in MODELS:

        try:

            print("\n===================================")
            print(f"Trying model: {model}")
            print("Sending request to Gemini...")

            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )

            print("Response received from Gemini.")
            print(f"✓ Success! Using {model}")

            if response is None:
                print("Response is None")
                continue

            print("Response Object:")
            print(response)

            if hasattr(response, "text"):
                print("Response Text:")
                print(response.text)
                return response.text

            print("Response has no text field.")
            last_error = Exception("Response has no text")

        except APIError as e:

            print(f"✗ API Error with {model}")
            print(str(e))
            last_error = e

        except Exception as e:

            print(f"✗ Unexpected Error with {model}")
            print(type(e))
            print(str(e))
            last_error = e

    raise Exception(
        f"All Gemini models failed.\nLast Error: {last_error}"
    )
def analyze_resume_with_gemini(resume_text):

    prompt = f"""
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

    result = generate_content(prompt)

    return result