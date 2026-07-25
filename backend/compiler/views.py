from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    CodeExecutionRequestSerializer,
    CodeExecutionResultSerializer,
    ExecutionHistorySerializer
)
from .services import piston_service, LANGUAGE_MAP
from .models import ExecutionHistory
from .permissions import ExecutionAnonRateThrottle, ExecutionUserRateThrottle


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ExecutionAnonRateThrottle, ExecutionUserRateThrottle])
def execute_code_view(request):
    """
    POST /api/compiler/execute/
    Executes user source code via Piston API execution service.
    Saves run history to ExecutionHistory database table.
    """
    serializer = CodeExecutionRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            "status": "error",
            "output": "",
            "error": "Invalid request payload.",
            "details": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    validated_data = serializer.validated_data
    language = validated_data.get("language")
    code = validated_data.get("code")
    stdin = validated_data.get("stdin", "")

    # Execute code via Piston Service
    result = piston_service.execute(
        language=language,
        code=code,
        stdin=stdin
    )

    # Save to ExecutionHistory if user is authenticated or anonymous
    user = request.user if request.user and request.user.is_authenticated else None

    try:
        ExecutionHistory.objects.create(
            user=user,
            language=language,
            source_code=code,
            stdin=stdin,
            stdout=result.get("stdout", ""),
            stderr=result.get("stderr", ""),
            execution_status=result.get("status", "error"),
            execution_time=result.get("execution_time", 0.0),
            memory_used=result.get("memory_used")
        )
    except Exception as e:
        print(f"Warning: Failed to record ExecutionHistory: {e}")

    result_serializer = CodeExecutionResultSerializer(data=result)
    result_serializer.is_valid()
    return Response(result_serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def execution_history_view(request):
    """
    GET /api/compiler/history/
    Retrieves past execution history for the authenticated user.
    """
    history_queryset = ExecutionHistory.objects.filter(user=request.user)[:50]
    serializer = ExecutionHistorySerializer(history_queryset, many=True)
    return Response({
        "success": True,
        "count": len(serializer.data),
        "history": serializer.data
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def runtimes_view(request):
    """
    GET /api/compiler/runtimes/
    Returns supported languages and aliases for the compiler module.
    """
    supported_languages = [
        {"name": "Python 3", "key": "python", "piston_alias": "python"},
        {"name": "C (GCC)", "key": "c", "piston_alias": "c"},
        {"name": "C++ (GCC)", "key": "cpp", "piston_alias": "c++"},
        {"name": "Java", "key": "java", "piston_alias": "java"},
        {"name": "JavaScript (Node.js)", "key": "javascript", "piston_alias": "javascript"},
        {"name": "Go", "key": "go", "piston_alias": "go"}
    ]
    return Response({
        "success": True,
        "supported_languages": supported_languages
    }, status=status.HTTP_200_OK)
