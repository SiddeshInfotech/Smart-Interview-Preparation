from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
import subprocess
import tempfile

@csrf_exempt
def run_code(request):
    if request.method == "POST":
        data = json.loads(request.body)
        code = data.get("code")
        language = data.get("language")

        try:
            if language == "python":
                result = subprocess.run(
                    ["python", "-c", code],
                    capture_output=True,
                    text=True
                )
                output = result.stdout or result.stderr

            elif language == "c":
                with tempfile.NamedTemporaryFile(suffix=".c", delete=False) as f:
                    f.write(code.encode())
                    filename = f.name

                exe = filename.replace(".c", "")
                subprocess.run(["gcc", filename, "-o", exe])
                result = subprocess.run([exe], capture_output=True, text=True)
                output = result.stdout or result.stderr

            elif language == "cpp":
                with tempfile.NamedTemporaryFile(suffix=".cpp", delete=False) as f:
                    f.write(code.encode())
                    filename = f.name

                exe = filename.replace(".cpp", "")
                subprocess.run(["g++", filename, "-o", exe])
                result = subprocess.run([exe], capture_output=True, text=True)
                output = result.stdout or result.stderr

            elif language == "java":
                output = "Java support coming soon 🚀"

            else:
                output = "Unsupported language"

        except Exception as e:
            output = str(e)

        return JsonResponse({"output": output})

    return JsonResponse({"error": "Invalid request"})