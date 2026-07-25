from rest_framework.permissions import BasePermission, SAFE_METHODS
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class ExecutionAnonRateThrottle(AnonRateThrottle):
    rate = "30/minute"


class ExecutionUserRateThrottle(UserRateThrottle):
    rate = "60/minute"


class IsAuthenticatedOrReadOnlyExecution(BasePermission):
    """
    Allows unrestricted access for code execution (AllowAny for sandbox execution),
    while protecting history retrieval (requires authentication).
    """
    def has_permission(self, request, view):
        if view.action in ["execute", "runtimes"]:
            return True
        return bool(request.user and request.user.is_authenticated)
