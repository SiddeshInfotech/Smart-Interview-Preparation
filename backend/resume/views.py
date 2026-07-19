from notifications.utils import create_notification

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Resume, ResumeAnalysis
from .serializers import ResumeSerializer, ResumeAnalysisSerializer

from .resume_parser import extract_resume_text
from ai.gemini_services import analyze_resume_with_gemini

from candidate.models import Candidate_Profile

import os
from django.conf import settings


# ==========================
# Upload Resume API
# ==========================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_resume(request):

    resume_file = request.FILES.get("resume")

    try:
        profile = Candidate_Profile.objects.get(
            user=request.user
        )

        candidate_id = profile.candidate_id

    except Candidate_Profile.DoesNotExist:
        return Response(
            {"error": "Candidate profile not found"},
            status=status.HTTP_404_NOT_FOUND
        )


    if not resume_file:
        return Response(
            {"error": "Resume file is required"},
            status=status.HTTP_400_BAD_REQUEST
        )


    resume_folder = os.path.join(
        settings.MEDIA_ROOT,
        "resumes"
    )

    os.makedirs(
        resume_folder,
        exist_ok=True
    )


    file_path = os.path.join(
        resume_folder,
        resume_file.name
    )


    with open(file_path, "wb+") as destination:
        for chunk in resume_file.chunks():
            destination.write(chunk)



    resume = Resume.objects.create(
        candidate_id=candidate_id,
        file_name=resume_file.name,
        file_path=file_path,
        file_size_kb=resume_file.size // 1024,
        status="uploaded"
    )


    # Notification
    create_notification(
        user=request.user,
        notification_type="resume",
        title="Resume Uploaded",
        message=f"Your resume '{resume.file_name}' has been uploaded successfully."
    )


    serializer = ResumeSerializer(resume)


    return Response(
        {
            "message": "Resume uploaded successfully",
            "data": serializer.data
        },
        status=status.HTTP_201_CREATED
    )



# ==========================
# View Resume API
# ==========================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def view_resume(request):

    candidate_id = request.GET.get("candidate_id")


    if candidate_id:
        resumes = Resume.objects.filter(
            candidate_id=candidate_id
        )

    else:
        resumes = Resume.objects.filter(
            candidate_id=request.user.candidate_profile.candidate_id
        )


    serializer = ResumeSerializer(
        resumes,
        many=True
    )


    return Response(
        {
            "message": "Resume retrieved successfully",
            "data": serializer.data
        },
        status=status.HTTP_200_OK
    )



# ==========================
# Analyze Resume API
# ==========================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def analyze_resume(request):

    resume_id = request.data.get("resume_id")


    if not resume_id:
        return Response(
            {
                "error": "Resume ID is required"
            },
            status=status.HTTP_400_BAD_REQUEST
        )


    try:

        resume = Resume.objects.get(
            resume_id=resume_id
        )


    except Resume.DoesNotExist:

        return Response(
            {
                "error": "Resume not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )



    try:

        resume.status = "processing"
        resume.save()



        print("1. Resume found")


        # Extract resume text
        resume_text = extract_resume_text(
            resume.file_path
        )


        print("2. Resume text extracted")



        # Gemini Analysis
        result = analyze_resume_with_gemini(
            resume_text

        )
       
                            
        print("TYPE:", type(result))
        print("RESULT:", result)
        


        print("3. Gemini response received")

        print("GEMINI RESULT:", result)



        analysis, created = ResumeAnalysis.objects.update_or_create(

            resume=resume,


            defaults={

                "role": result.get("role", ""),

                "experience": result.get("experience", ""),


                "candidate_name": result.get(
                    "candidate_name",
                    ""
                ),


                "email": result.get(
                    "email",
                    ""
                ),


                "education": result.get(
                    "education",
                    ""
                ),


                "location": result.get(
                    "location",
                    ""
                ),



                "linkedin": result.get(
                    "linkedin",
                    ""
                ),


                "github": result.get(
                    "github",
                    ""
                ),


                "portfolio": result.get(
                    "portfolio",
                    ""
                ),



                "summary": result.get(
                    "summary",
                    ""
                ),


                "resume_score": result.get(
                    "resume_score",
                    0
                ),



                "extracted_skills": ", ".join(
                    result.get(
                        "skills",
                        []
                    )
                ),


                "matched_skills": ", ".join(
                    result.get(
                        "matched_skills",
                        []
                    )
                ),


                "missing_skills": ", ".join(
                    result.get(
                        "missing_skills",
                        []
                    )
                ),


                "suggested_next_skills": ", ".join(
                    result.get(
                        "suggested_next_skills",
                        []
                    )
                ),


                "skill_category": result.get(
                    "skill_category",
                    ""
                ),



                "suggestion_1": result.get(
                    "suggestions",
                    ["", "", ""]
                )[0],


                "suggestion_2": result.get(
                    "suggestions",
                    ["", "", ""]
                )[1],


                "suggestion_3": result.get(
                    "suggestions",
                    ["", "", ""]
                )[2],

            }

        )



        resume.status = "analyzed"
        resume.save()



        # Success Notification
        create_notification(
            user=request.user,
            notification_type="resume",
            title="Resume Analysis Completed",
            message="Your resume has been analyzed successfully."
        )



        serializer = ResumeAnalysisSerializer(
            analysis
        )



        return Response(
            {
                "message": "Resume analyzed successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )


    except Exception as e:

        print("ANALYZE ERROR:", str(e))

    resume.status = "failed"
    resume.save()

    print("Creating failed notification...")

    notification = create_notification(
        user=request.user,
        notification_type="resume",
        title="Resume Analysis Failed",
        message="Your resume analysis failed. Please upload your resume again."
    )

    print("Notification Created:", notification.notification_id)

    return Response(
        {
            "error": str(e)
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
        # ==========================
# Resume Score API
# ==========================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def resume_score(request):

    resume_id = request.GET.get("resume_id")


    try:

        analysis = ResumeAnalysis.objects.get(
            resume__resume_id=resume_id
        )


        return Response(
            {
                "resume_score": analysis.resume_score
            },
            status=status.HTTP_200_OK
        )


    except ResumeAnalysis.DoesNotExist:


        return Response(
            {
                "error": "Analysis not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )



# ==========================
# Resume Suggestions API
# ==========================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def resume_suggestions(request):

    resume_id = request.GET.get("resume_id")


    try:

        analysis = ResumeAnalysis.objects.get(
            resume__resume_id=resume_id
        )


        return Response(
            {

                "suggestion_1": analysis.suggestion_1,

                "suggestion_2": analysis.suggestion_2,

                "suggestion_3": analysis.suggestion_3,

            },
            status=status.HTTP_200_OK
        )


    except ResumeAnalysis.DoesNotExist:


        return Response(
            {
                "error": "Analysis not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )



# ==========================
# Add To Profile API
# ==========================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_to_profile(request):

    resume_id = request.data.get("resume_id")


    print("===== ADD TO PROFILE API CALLED =====")
    print("Resume ID:", resume_id)



    if not resume_id:

        return Response(
            {
                "error": "Resume ID is required"
            },
            status=status.HTTP_400_BAD_REQUEST
        )



    try:


        resume = Resume.objects.get(
            resume_id=resume_id
        )


        analysis = ResumeAnalysis.objects.get(
            resume=resume
        )



        profile = Candidate_Profile.objects.get(
            user=request.user
        )



        print("Candidate Profile Found")

        print(
            "Profile Email:",
            profile.user.email
        )

        print(
            "Resume Email:",
            analysis.email
        )



        # Email Matching

        if (
            profile.user.email.strip().lower()
            !=
            analysis.email.strip().lower()
        ):


            return Response(
                {
                    "error":
                    "Resume email does not match your profile email."
                },
                status=status.HTTP_400_BAD_REQUEST
            )



        # Update Profile Data


        profile.education = analysis.education


        profile.location = analysis.location


        profile.skills = analysis.extracted_skills



        profile.linkedin_url = analysis.linkedin


        profile.github_url = analysis.github


        profile.portfolio_url = analysis.portfolio



        # Experience Conversion

        try:

            import re


            experience_text = (
                analysis.experience
                or ""
            )


            match = re.search(
                r"(\d+(\.\d+)?)\s*(year|years)",
                experience_text.lower()
            )


            if match:

                profile.experience_years = float(
                    match.group(1)
                )

            else:

                profile.experience_years = 0



        except Exception as e:


            print(
                "Experience Error:",
                e
            )

            profile.experience_years = 0



        profile.save()



        print(
            "Profile saved successfully"
        )



        return Response(
            {
                "message":
                "Profile updated successfully"
            },
            status=status.HTTP_200_OK
        )



    except Resume.DoesNotExist:


        return Response(
            {
                "error": "Resume not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )



    except ResumeAnalysis.DoesNotExist:


        return Response(
            {
                "error": "Resume is not analyzed"
            },
            status=status.HTTP_404_NOT_FOUND
        )



    except Candidate_Profile.DoesNotExist:


        return Response(
            {
                "error": "Candidate profile not found"
            },
            status=status.HTTP_404_NOT_FOUND
        )