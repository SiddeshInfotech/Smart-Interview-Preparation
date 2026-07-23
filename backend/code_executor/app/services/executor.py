import docker
import tempfile
import os

from app.schemas.execute_schema import (
    CodeExecutionRequest,
    CodeExecutionResponse,
)


def get_docker_client():
    try:
        return docker.from_env()
    except Exception as e:
        return None


def generate_solution_hint(language: str, error_text: str) -> str:
    if not error_text:
        return "No specific error details provided. Check your code syntax and logic."

    err_lower = error_text.lower()
    solutions = []

    if language == "python":
        if "syntaxerror" in err_lower:
            solutions.append("Check for missing closing parentheses ')', brackets ']', quotes '\"', or missing colons ':' at the end of if/def/for statements.")
        if "indentationerror" in err_lower:
            solutions.append("Ensure consistent block indentation (use 4 spaces per indentation level). Do not mix tabs and spaces.")
        if "nameerror" in err_lower:
            solutions.append("Verify that all variable and function names are spelled correctly and defined before use.")
        if "typeerror" in err_lower:
            solutions.append("Check data types. If accepting input via input(), wrap it with int() or float() before performing mathematical operations.")
        if "zerodivisionerror" in err_lower:
            solutions.append("Division by zero occurred. Add a check to ensure denominator is non-zero before dividing.")
        if "indexerror" in err_lower:
            solutions.append("List index out of range. Check list length using len() before accessing elements.")
        if "eoferror" in err_lower:
            solutions.append("EOFError: input() attempted to read input but standard input was empty. Type input values into the Standard Input box below before running.")

    elif language in ["c", "cpp"]:
        if "expected ';'" in err_lower or "expected ';' before" in err_lower:
            solutions.append("Add a missing semicolon ';' at the end of the previous statement.")
        if "undefined reference to `main'" in err_lower or "undefined reference to 'main'" in err_lower:
            solutions.append("Ensure your program defines an entry function: int main() { ... return 0; }.")
        if "was not declared in this scope" in err_lower:
            solutions.append("Check variable spelling or include missing header libraries (e.g. #include <stdio.h>, #include <iostream>, #include <string>).")
        if "expected '}'" in err_lower or "expected '}' at end of input" in err_lower:
            solutions.append("Closing brace '}' missing. Ensure all opened '{' curly braces are closed.")
        if "no such file or directory" in err_lower:
            solutions.append("Check header name spelling in your #include directive.")

    elif language == "java":
        if "nosuchelementexception" in err_lower:
            solutions.append("NoSuchElementException: Scanner attempted to read input (e.g. sc.nextInt() or sc.next()) but standard input was empty. Type input values into the Standard Input box below before running.")
        if "should be declared in a file named" in err_lower:
            solutions.append("In Java, the public class must be named Main so it matches 'Main.java'. Use: public class Main { ... }.")
        if "cannot find symbol" in err_lower:
            solutions.append("Cannot find symbol: Check method/variable name spelling and case sensitivity, or import required packages.")
        if "expected" in err_lower and ";" in err_lower:
            solutions.append("Missing semicolon ';' at the end of the statement.")
        if "reached end of file while parsing" in err_lower:
            solutions.append("Missing closing curly brace '}'. Check that all class and method blocks are properly closed.")
        if "nullpointerexception" in err_lower:
            solutions.append("NullPointerException: An object variable is null. Initialize objects before invoking methods on them.")
        if "arrayindexoutofboundsexception" in err_lower:
            solutions.append("ArrayIndexOutOfBoundsException: Array index is out of bounds. Verify loop conditions and array size.")

    if not solutions:
        solutions.append("Review the error message line number and trace to locate the issue in your code.")

    return " ".join(solutions)


def execute_code(request: CodeExecutionRequest) -> CodeExecutionResponse:
    client = get_docker_client()
    if not client:
        err_msg = "Docker Desktop engine is not connected or not running on host machine."
        return CodeExecutionResponse(
            status="error",
            output="",
            error=err_msg,
            solution="Ensure Docker Desktop is installed and running on your system."
        )

    try:
        with tempfile.TemporaryDirectory() as temp:
            language = request.language.lower()

            # -----------------------------
            # Language Configuration
            # -----------------------------
            if language == "python":
                filename = "main.py"
                image = "python:3.13-slim"
                command = 'sh -c "export PYTHONPATH=/code && python /code/main.py < /code/input.txt"'

            elif language == "java":
                filename = "Main.java"
                image = "eclipse-temurin:17-alpine"
                command = 'sh -c "javac /code/Main.java && java -cp /code Main < /code/input.txt"'

            elif language == "c":
                filename = "main.c"
                image = "gcc:latest"
                command = 'sh -c "gcc /code/main.c -o /code/main && /code/main < /code/input.txt"'

            elif language == "cpp":
                filename = "main.cpp"
                image = "gcc:latest"
                command = 'sh -c "g++ /code/main.cpp -o /code/main && /code/main < /code/input.txt"'

            else:
                return CodeExecutionResponse(
                    status="error",
                    output="",
                    error="Unsupported language.",
                    solution="Supported languages are: python, c, cpp, java."
                )

            # -----------------------------
            # Save Source Code & Input
            # -----------------------------
            code_path = os.path.join(temp, filename)
            if language == "python":
                wrapper = (
                    "import builtins, sys\n"
                    "try:\n"
                    "    _orig_input = builtins.input\n"
                    "    _eof_count = 0\n"
                    "    def _safe_input(prompt=''):\n"
                    "        global _eof_count\n"
                    "        try:\n"
                    "            return _orig_input(prompt)\n"
                    "        except EOFError:\n"
                    "            _eof_count += 1\n"
                    "            if _eof_count > 2:\n"
                    "                sys.exit(0)\n"
                    "            return ''\n"
                    "    builtins.input = _safe_input\n"
                    "except Exception:\n"
                    "    pass\n\n"
                )
                with open(code_path, "w", encoding="utf-8") as f:
                    f.write(wrapper + request.code)
                
                site_path = os.path.join(temp, "sitecustomize.py")
                with open(site_path, "w", encoding="utf-8") as f:
                    f.write(wrapper)
            else:
                with open(code_path, "w", encoding="utf-8") as f:
                    f.write(request.code)

            input_path = os.path.join(temp, "input.txt")
            with open(input_path, "w", encoding="utf-8") as f:
                user_in = request.input or ""
                # Append padding newlines so sequential input() / Scanner calls never crash with EOFError
                padded_input = user_in + "\n" + ("\n" * 500)
                f.write(padded_input)

            # -----------------------------
            # Run Container with Docker
            # -----------------------------
            container = client.containers.run(
                image=image,
                command=command,
                volumes={
                    temp: {
                        "bind": "/code",
                        "mode": "rw"
                    }
                },
                working_dir="/code",
                stdout=True,
                stderr=True,
                remove=True,
                network_disabled=True,
                mem_limit="256m",
                nano_cpus=1000000000,
                detach=False,
            )

            out_str = container.decode("utf-8")
            return CodeExecutionResponse(
                status="success",
                output=out_str,
                error="",
                solution=""
            )

    except docker.errors.ContainerError as e:
        error_output = ""
        if e.stderr:
            error_output = e.stderr.decode("utf-8")
        elif e.stdout:
            error_output = e.stdout.decode("utf-8")
        else:
            error_output = str(e)

        solution_hint = generate_solution_hint(request.language.lower(), error_output)

        return CodeExecutionResponse(
            status="error",
            output="",
            error=error_output,
            solution=solution_hint
        )

    except docker.errors.APIError as e:
        error_output = str(e)
        solution_hint = generate_solution_hint(request.language.lower(), error_output)
        return CodeExecutionResponse(
            status="error",
            output="",
            error=error_output,
            solution=solution_hint
        )

    except Exception as e:
        error_output = str(e)
        solution_hint = generate_solution_hint(request.language.lower(), error_output)
        return CodeExecutionResponse(
            status="error",
            output="",
            error=error_output,
            solution=solution_hint
        )