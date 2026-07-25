from rest_framework import serializers
from .models import ExecutionHistory


class CodeExecutionRequestSerializer(serializers.Serializer):
    language = serializers.CharField(
        max_length=50,
        required=True,
        help_text="Programming language (python, c, cpp, java, javascript)"
    )
    code = serializers.CharField(
        required=True,
        allow_blank=False,
        help_text="Source code to execute"
    )
    stdin = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Standard input stream"
    )
    input = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Alias for stdin"
    )

    def validate(self, attrs):
        # Handle 'input' alias if provided instead of 'stdin'
        if not attrs.get("stdin") and attrs.get("input"):
            attrs["stdin"] = attrs.get("input")
        return attrs


class CodeExecutionResultSerializer(serializers.Serializer):
    status = serializers.CharField()
    output = serializers.CharField(allow_blank=True)
    error = serializers.CharField(allow_blank=True)
    stdout = serializers.CharField(allow_blank=True)
    stderr = serializers.CharField(allow_blank=True)
    exit_code = serializers.IntegerField(required=False, allow_null=True)
    execution_time = serializers.FloatField(required=False, default=0.0)
    memory_used = serializers.IntegerField(required=False, allow_null=True)
    solution = serializers.CharField(allow_blank=True, required=False)


class ExecutionHistorySerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True, default=None)

    class Meta:
        model = ExecutionHistory
        fields = [
            "id",
            "user_email",
            "language",
            "source_code",
            "stdin",
            "stdout",
            "stderr",
            "execution_status",
            "execution_time",
            "memory_used",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
