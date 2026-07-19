import google.generativeai as genai
from django.conf import settings

# Configure API
genai.configure(api_key=settings.GEMINI_API_KEY)

# Models in priority order (valid ones)
MODELS = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]


def generate_content(prompt):
    """
    Generates content using available Gemini models
    with fallback support
    """

    last_error = None

    for model_name in MODELS:
        try:
            print(f"\nTrying model: {model_name}")

            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)

            print(f"✓ Success! Using {model_name}")

            return response.text

        except Exception as e:
            print(f"✗ {model_name} failed")
            print(f"Reason: {e}")
            last_error = e

    raise Exception(f"All Gemini models failed. Last Error: {last_error}")