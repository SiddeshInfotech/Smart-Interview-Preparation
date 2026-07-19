from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .judge0 import Judge0Error, LANGUAGE_ID_MAP, submit_code
from .models import Submission
from .serializers import RunCodeRequestSerializer, SubmissionSerializer

# Judge0 status IDs 3 = Accepted (ran successfully, may still have wrong output).
# Anything else that's terminal is treated as an error/failure state for our
# simplified status field.
ACCEPTED_STATUS_ID = 3


class LanguageListView(APIView):
    """GET /api/compiler/languages/ -> languages the editor can offer."""

    def get(self, request):
        return Response(
            [{"value": key, "label": key.capitalize()} for key in LANGUAGE_ID_MAP]
        )


class RunCodeView(APIView):
    """POST /api/compiler/run/ -> execute code via Judge0 and persist the result."""

    def post(self, request):
        req = RunCodeRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        data = req.validated_data

        submission = Submission.objects.create(
            language=data["language"],
            source_code=data["source_code"],
            stdin=data.get("stdin", ""),
            status="running",
        )

        try:
            result = submit_code(
                language=data["language"],
                source_code=data["source_code"],
                stdin=data.get("stdin", ""),
            )
        except Judge0Error as exc:
            submission.status = "error"
            submission.stderr = str(exc)
            submission.save()
            return Response(
                SubmissionSerializer(submission).data,
                status=status.HTTP_502_BAD_GATEWAY,
            )

        submission.judge0_token = result["token"]
        submission.judge0_status_description = result["status_description"]
        submission.stdout = result["stdout"]
        submission.stderr = result["stderr"]
        submission.compile_output = result["compile_output"]
        submission.execution_time = result["time"] or ""
        submission.memory_used = result["memory"]
        submission.status = "completed" if result["status_id"] == ACCEPTED_STATUS_ID else "error"
        submission.save()

        return Response(SubmissionSerializer(submission).data, status=status.HTTP_200_OK)


class SubmissionHistoryView(APIView):
    """GET /api/compiler/history/ -> most recent submissions."""

    def get(self, request):
        submissions = Submission.objects.all()[:20]
        return Response(SubmissionSerializer(submissions, many=True).data)
