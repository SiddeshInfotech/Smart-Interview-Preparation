from rest_framework import serializers

from .judge0 import LANGUAGE_ID_MAP
from .models import Submission


class RunCodeRequestSerializer(serializers.Serializer):
    language = serializers.ChoiceField(choices=list(LANGUAGE_ID_MAP.keys()))
    source_code = serializers.CharField(allow_blank=False, trim_whitespace=False)
    stdin = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False, default="")


class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = [
            "id",
            "language",
            "source_code",
            "stdin",
            "stdout",
            "stderr",
            "compile_output",
            "status",
            "judge0_status_description",
            "execution_time",
            "memory_used",
            "created_at",
        ]
        read_only_fields = fields
