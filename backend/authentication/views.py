from django.shortcuts import render
from django.http import JsonResponse

def register(request):
    return JsonResponse({"message": "Register endpoint working"})

def login(request):
    return JsonResponse({"message": "Login endpoint working"})

def logout(request):
    return JsonResponse({"message": "Logout endpoint working"})

def forgot_password(request):
    return JsonResponse({"message": "Forgot Password endpoint working"})

def reset_password(request):
    return JsonResponse({"message": "Reset Password endpoint working"})

def profile(request):
    return JsonResponse({"message": "Profile endpoint working"})