from google import genai
from google.genai.errors import APIError
from django.conf import settings

# Initialize Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Models in priority order
MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
]


def generate_content(prompt):
    """
    Generates content using the first available Gemini model.
    Automatically falls back if a model is unavailable.
    """

    last_error = None

    for model in MODELS:
        try:
            print(f"\nTrying model: {model}")

            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )

            print(f"✓ Success! Using {model}")

            return response.text

        except APIError as e:
            print(f"✗ {model} failed.")
            print(f"Reason: {e}")
            last_error = e

        except Exception as e:
            print(f"✗ Unexpected error with {model}")
            print(e)
            last_error = e

    raise Exception(
        f"All Gemini models failed.\nLast Error: {last_error}"
    )