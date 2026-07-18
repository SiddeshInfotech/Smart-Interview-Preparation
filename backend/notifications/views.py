from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def get_notifications(request):

    notifications = [
        {
            "id": 1,
            "type": "system",
            "title": "Welcome",
            "message": "Welcome to PrepMaster AI",
            "time": "Just now",
            "read": False,
        },
        {
            "id": 2,
            "type": "document",
            "title": "Resume Uploaded",
            "message": "Your resume has been uploaded successfully.",
            "time": "5 min ago",
            "read": False,
        },
        {
            "id": 3,
            "type": "result",
            "title": "Resume Analysis Complete",
            "message": "Your resume analysis is ready.",
            "time": "15 min ago",
            "read": True,
        },
    ]

    return Response(notifications)


@api_view(["DELETE"])
def delete_notification(request, id):

    return Response({
        "message": f"Notification {id} deleted successfully"
    })

@api_view(["DELETE"])
def delete_notification(request, id):
    return Response({"message": f"Notification {id} deleted successfully"})