import time
import logging
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import connection

from candidate.services import get_candidate_profile_data
from notifications.services import get_recent_notifications, get_unread_notifications_count
from authentication.services import get_user_usage_summary
from .services import get_optimized_daily_progress, get_optimized_ai_intelligence

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_dashboard(request):
    return Response({"message": "dashboard loaded successfully"})


@api_view(["GET"])
@permission_classes([AllowAny])
def get_daily_progress(request):
    data = get_optimized_daily_progress(request.user)
    return Response({
        "success": True,
        "daily_progress": data
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def get_ai_intelligence(request):
    data = get_optimized_ai_intelligence(request.user)
    res_data = {"success": True}
    res_data.update(data)
    return Response(res_data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_dashboard_bootstrap(request):
    """
    Main Orchestrator Endpoint: Returns consolidated Dashboard data in a single optimized payload.
    Measures execution time of every individual service and logs SQL query count.
    """
    t_start = time.perf_counter()
    user = request.user
    user_pk = getattr(user, "pk", getattr(user, "user_id", None))
    queries_before = len(connection.queries)

    # 1. Profile Service
    t0 = time.perf_counter()
    profile_data = get_candidate_profile_data(user)
    t_profile = (time.perf_counter() - t0) * 1000

    # 2. Notifications Service
    t0 = time.perf_counter()
    recent_notifications = get_recent_notifications(user, limit=10)
    unread_notifications_count = get_unread_notifications_count(user)
    t_notifications = (time.perf_counter() - t0) * 1000

    # 3. Auth Usage Service
    t0 = time.perf_counter()
    usage_data = get_user_usage_summary(user)
    t_usage = (time.perf_counter() - t0) * 1000

    # 4. Daily Progress Service
    t0 = time.perf_counter()
    daily_progress_data = get_optimized_daily_progress(user)
    t_daily_progress = (time.perf_counter() - t0) * 1000

    # 5. AI Intelligence Service
    t0 = time.perf_counter()
    ai_intelligence_data = get_optimized_ai_intelligence(user)
    t_ai_intelligence = (time.perf_counter() - t0) * 1000

    t_total = (time.perf_counter() - t_start) * 1000
    queries_executed = len(connection.queries) - queries_before

    logger.info(f"--- Dashboard Bootstrap Timing Breakdown for user {user_pk} ---")
    logger.info(f"Profile Service: {t_profile:.2f} ms")
    logger.info(f"Notification Service: {t_notifications:.2f} ms")
    logger.info(f"Usage Service: {t_usage:.2f} ms")
    logger.info(f"Daily Progress Service: {t_daily_progress:.2f} ms")
    logger.info(f"AI Intelligence Service: {t_ai_intelligence:.2f} ms")
    logger.info(f"Bootstrap API Total Execution Time: {t_total:.2f} ms (SQL Queries: {queries_executed})")

    return Response({
        "profile": profile_data,
        "usage": usage_data,
        "notifications": recent_notifications,
        "unread_notifications_count": unread_notifications_count,
        "daily_progress": daily_progress_data,
        "ai_intelligence": ai_intelligence_data,
        "performance_meta": {
            "execution_time_ms": round(t_total, 2),
            "sql_queries": queries_executed,
        }
    })