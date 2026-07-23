from rest_framework import serializers

from .models import (
    CodingQuestion,
    CodeSubmission
)



class CodingQuestionSerializer(serializers.ModelSerializer):

    class Meta:

        model = CodingQuestion

        fields = "__all__"



class CodeSubmissionSerializer(serializers.ModelSerializer):

    class Meta:

        model = CodeSubmission

        fields = "__all__"

        read_only_fields = [
            "user",
            "output",
            "error",
            "status",
            "score",
            "submitted_at"
        ]