from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Create your views here.
@api_view(["GET"])
def get_notifications(request):
    return Response({"message": "Notifications retrieved successfully"})

@api_view(["DELETE"])
def delete_notification(request, id):
    return Response({"message": f"Notification {id} deleted successfully"})