from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["GET"])
def get_questions(request):
    return Response({"message": "Coding questions retrieved successfully."})

@api_view(["POST"])
def run_code(request):
    return Response({"message": "Code executed successfully."})

@api_view(["POST"])
def submit_code(request):
    return Response({"message": "Code submitted successfully."})

@api_view(["GET"])
def get_coding_result(request):
    return Response({"message": "Coding result retrieved successfully."})
