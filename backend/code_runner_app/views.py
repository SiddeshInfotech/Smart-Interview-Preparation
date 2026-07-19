from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
import subprocess
import tempfile
import os


@csrf_exempt
def run_code(request):

    if request.method == "POST":

        data = json.loads(request.body)

        code = data.get("code")
        language = data.get("language")
        user_input = data.get("input", "")

        output = ""

        try:

            # ================= PYTHON =================
            if language == "python":

                result = subprocess.run(
                    ["python", "-c", code],
                    input=user_input,
                    capture_output=True,
                    text=True
                )

                output = result.stdout or result.stderr


            # ================= C =================
            elif language == "c":

                with tempfile.NamedTemporaryFile(
                    suffix=".c",
                    delete=False,
                    mode="w"
                ) as f:

                    f.write(code)
                    filename = f.name


                exe_file = filename.replace(".c", "")


                compile_result = subprocess.run(
                    ["gcc", filename, "-o", exe_file],
                    capture_output=True,
                    text=True
                )


                if compile_result.returncode != 0:
                    output = compile_result.stderr

                else:

                    result = subprocess.run(
                        [exe_file],
                        input=user_input,
                        capture_output=True,
                        text=True
                    )

                    output = result.stdout or result.stderr



            # ================= C++ =================
            elif language == "cpp":

                with tempfile.NamedTemporaryFile(
                    suffix=".cpp",
                    delete=False,
                    mode="w"
                ) as f:

                    f.write(code)
                    filename = f.name


                exe_file = filename.replace(".cpp", "")


                compile_result = subprocess.run(
                    ["g++", filename, "-o", exe_file],
                    capture_output=True,
                    text=True
                )


                if compile_result.returncode != 0:
                    output = compile_result.stderr

                else:

                    result = subprocess.run(
                        [exe_file],
                        input=user_input,
                        capture_output=True,
                        text=True
                    )

                    output = result.stdout or result.stderr



            # ================= JAVA =================
            elif language == "java":

                with tempfile.TemporaryDirectory() as folder:

                    java_file = os.path.join(folder, "Main.java")


                    with open(java_file, "w") as f:
                        f.write(code)


                    compile_result = subprocess.run(
                        [
                            "javac",
                            java_file
                        ],
                        capture_output=True,
                        text=True
                    )


                    if compile_result.returncode != 0:

                        output = compile_result.stderr

                    else:

                        result = subprocess.run(
                            [
                                "java",
                                "-cp",
                                folder,
                                "Main"
                            ],
                            input=user_input,
                            capture_output=True,
                            text=True
                        )

                        output = result.stdout or result.stderr



            else:

                output = "Unsupported language"



        except Exception as e:

            output = str(e)



        return JsonResponse({
            "output": output
        })


    return JsonResponse({
        "error": "Invalid request"
    })