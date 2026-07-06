from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["POST"])
def upload_resume(request):
    return Response({"message": "Resume uploaded successfully."})

@api_view(["GET"])
def view_resume(request):
    return Response({"message": "Resume retrieved successfully."})

@api_view(["POST"])
def analyze_resume(request):
    return Response({"message": "Resume analyzed successfully."})

@api_view(["GET"])
def resume_score(request):
    return Response({"message": "Resume score retrieved successfully."})

@api_view(["GET"])
def resume_suggestions(request):
    return Response({"message": "Resume suggestions retrieved successfully."})
