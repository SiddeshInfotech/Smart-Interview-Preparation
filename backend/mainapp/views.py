from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
import sys
import io
import subprocess
import tempfile
import os

@csrf_exempt
def run_code(request):
    if request.method == "POST":
        data = json.loads(request.body)
        code = data.get("code")
        language = data.get("language")

        try:
            # 🐍 PYTHON
            if language == "python":
                old_stdout = sys.stdout
                sys.stdout = io.StringIO()

                try:
                    exec(code)
                    output = sys.stdout.getvalue()
                except Exception as e:
                    output = str(e)

                sys.stdout = old_stdout

            # 🟢 C
            elif language == "c":
                with tempfile.NamedTemporaryFile(delete=False, suffix=".c") as f:
                    f.write(code.encode())
                    file_name = f.name

                exe_file = file_name + ".out"

                compile = subprocess.run(
                    ["gcc", file_name, "-o", exe_file],
                    capture_output=True,
                    text=True
                )

                if compile.returncode != 0:
                    output = compile.stderr
                else:
                    run = subprocess.run(
                        [exe_file],
                        capture_output=True,
                        text=True
                    )
                    output = run.stdout or run.stderr

            # 🟣 C++
            elif language == "cpp":
                with tempfile.NamedTemporaryFile(delete=False, suffix=".cpp") as f:
                    f.write(code.encode())
                    file_name = f.name

                exe_file = file_name + ".out"

                compile = subprocess.run(
                    ["g++", file_name, "-o", exe_file],
                    capture_output=True,
                    text=True
                )

                if compile.returncode != 0:
                    output = compile.stderr
                else:
                    run = subprocess.run(
                        [exe_file],
                        capture_output=True,
                        text=True
                    )
                    output = run.stdout or run.stderr

            # ☕ JAVA
            elif language == "java":
                with tempfile.TemporaryDirectory() as temp_dir:
                    file_path = os.path.join(temp_dir, "Main.java")

                    with open(file_path, "w") as f:
                        f.write(code)

                    compile = subprocess.run(
                        ["javac", file_path],
                        capture_output=True,
                        text=True
                    )

                    if compile.returncode != 0:
                        output = compile.stderr
                    else:
                        run = subprocess.run(
                            ["java", "-cp", temp_dir, "Main"],
                            capture_output=True,
                            text=True
                        )
                        output = run.stdout or run.stderr

            else:
                output = "Language not supported ❌"

        except Exception as e:
            output = str(e)

        return JsonResponse({"output": output})

    return JsonResponse({"error": "Invalid request"})