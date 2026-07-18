from django.core.mail import send_mail

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import Feedback
from .serializers import FeedbackSerializer


class FeedbackAPIView(APIView):

    permission_classes = [AllowAny]

    # GET ALL FEEDBACK
    def get(self, request):

        feedback = Feedback.objects.all().order_by("-submitted_at")

        serializer = FeedbackSerializer(
            feedback,
            many=True
        )

        return Response(serializer.data)

    # SUBMIT FEEDBACK
    def post(self, request):

        print("DATA RECEIVED:", request.data)

        serializer = FeedbackSerializer(data=request.data)

        if serializer.is_valid():

            feedback = serializer.save()

            # Email to User
            send_mail(
                subject="Thank You for Your Feedback - PrepMaster AI",

                message=f"""
Hello {feedback.name},

Thank you for submitting your feedback.

We have successfully received your feedback.

Here is a summary of your feedback:

Overall Experience: {feedback.overall_experience}
Mock Interview: {feedback.mock_interview}


Comments:
{feedback.comments}

Recommendation:
{feedback.recommend}

Reason:
{feedback.recommendation_reason}

We appreciate your valuable feedback and will use it to improve PrepMaster AI.

Regards,
PrepMaster AI Team
""",

                from_email="projectssvps2026@gmail.com",

                recipient_list=[feedback.email],

                fail_silently=False,
            )

            # Email to Admin
            send_mail(
                subject="New Feedback Submitted - PrepMaster AI",

                message=f"""
Hello Admin,

{feedback.name} has submitted feedback.

Please check the Admin Panel for complete details.

Submitted By:

Name: {feedback.name}
Email: {feedback.email}

Regards,
PrepMaster AI Team
""",

                from_email="projectssvps2026@gmail.com",

                recipient_list=["projectssvps2026@gmail.com"],

                fail_silently=False,
            )

            return Response(
                {
                    "message": "Feedback submitted successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        print("ERROR:", serializer.errors)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )