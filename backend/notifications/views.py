from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Notification
from .services import (
    get_recent_notifications,
    get_unread_notifications_count,
    invalidate_notification_cache,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifications = get_recent_notifications(request.user, limit=50)
    unread_count = get_unread_notifications_count(request.user)

    return Response(
        {
            "message": "Notifications fetched successfully",
            "unread_count": unread_count,
            "data": notifications,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_as_read(request, notification_id):
    try:
        notification = Notification.objects.get(
            notification_id=notification_id, user=request.user
        )

        notification.is_read = True
        notification.save(update_fields=["is_read"])
        invalidate_notification_cache(request.user.id)

        return Response(
            {"message": "Notification marked as read"},
            status=status.HTTP_200_OK,
        )

    except Notification.DoesNotExist:
        return Response(
            {"message": "Notification not found"},
            status=status.HTTP_404_NOT_FOUND,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_all_as_read(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    invalidate_notification_cache(request.user.id)

    return Response(
        {"message": "All notifications marked as read"},
        status=status.HTTP_200_OK,
    )