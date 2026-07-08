from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Create your views here.
@api_view(["GET"])
def get_users(request):
    return Response({"message": "Users retrieved successfully"})

@api_view(["PUT"])
def update_user(request, id):
    return Response({"message": f"User {id} updated successfully"})

@api_view(["POST"])
def add_question(request):
    return Response({"message": "Question added successfully"})


@api_view(["DELETE"])
def delete_question(request, id):
    return Response({"message": f"Question {id} deleted successfully"})


@api_view(["GET"])
def get_analytics(request):
    return Response({"message": "Analytics retrieved successfully"})


@api_view(["GET"])
def get_interviews(request):
    return Response({"message": "Interviews retrieved successfully"})


@api_view(["DELETE"])
def delete_interview(request, id):
    return Response({"message": f"Interview {id} deleted successfully"})