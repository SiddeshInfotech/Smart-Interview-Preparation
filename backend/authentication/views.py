from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
def register(request):
    return Response({"message": "Registration endpoint is working"})

@api_view(["POST"])
def login(request):
    return Response({"message": "Login endpoint is working"})

@api_view(["POST"])
def logout(request):
    return Response({"message": "Logout endpoint is working"})

@api_view(["POST"])
def forgot_password(request):
    return Response({"message": "Forgot password endpoint is working"})

@api_view(["POST"])
def reset_password(request):
    return Response({"message": "Reset password endpoint is working"})

@api_view(["GET", "PUT"])
def profile(request):
    if (request.method == "GET"):
        return Response({"message": "Profile retrieved successfully"})
    if (request.method == "PUT"):
        return Response({"message": "Profile updated successfully"})
