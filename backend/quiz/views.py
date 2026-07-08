from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["GET"])
def questions(request):
    return Response({"message": "Quiz questions retrieved successfully."})

@api_view(["POST"])
def submit(request):
    return Response({"message": "Quiz submitted successfully."})

@api_view(["GET"])
def result(request):
    return Response({"message": "Quiz result retrieved successfully."})
