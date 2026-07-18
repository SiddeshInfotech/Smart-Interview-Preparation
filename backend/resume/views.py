import json
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

   

    resume_folder = os.path.join(settings.MEDIA_ROOT, "resumes")
    os.makedirs(resume_folder, exist_ok=True)

    file_path = os.path.join(resume_folder, resume_file.name)

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
def view_resume(request):

    candidate_id = request.GET.get("candidate_id")

    if candidate_id:
        resumes = Resume.objects.filter(candidate_id=candidate_id)
    else:
        resumes = Resume.objects.all()

    serializer = ResumeSerializer(resumes, many=True)

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
def analyze_resume(request):

    resume_id = request.data.get("resume_id")

    if not resume_id:
        return Response(
            {"error": "Resume ID is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        resume = Resume.objects.get(resume_id=resume_id)

    except Resume.DoesNotExist:
        return Response(
            {"error": "Resume not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    try:

        # Processing
        resume.status = "processing"
        resume.save()

        print("1. Resume found")

        # Extract text
        resume_text = extract_resume_text(resume.file_path)
        print("2. Resume text extracted")

        # Gemini
        result = analyze_resume_with_gemini(resume_text)
        print("3. Gemini response received")

        # Convert JSON
        result = result.replace("```json", "").replace("```", "").strip()
        result = json.loads(result)
        print("4. JSON converted")

        print("GEMINI RESULT:", result)
        print("Gemini Email:", result.get("email"))
        print("Gemini Name:", result.get("candidate_name"))

        analysis, created = ResumeAnalysis.objects.update_or_create(

            resume=resume,

            defaults={

                "role": result.get("role", ""),
                "experience": result.get("experience", ""),

                "candidate_name": result.get("candidate_name", ""),
                "email": result.get("email", ""),
                "education": result.get("education", ""),
                "location": result.get("location", ""),

                "linkedin": result.get("linkedin", ""),
                "github": result.get("github", ""),
                "portfolio": result.get("portfolio", ""),

                "summary": result.get("summary", ""),
                "resume_score": result.get("resume_score", 0),

                "extracted_skills": ", ".join(result.get("skills", [])),
                "matched_skills": ", ".join(result.get("matched_skills", [])),
                "missing_skills": ", ".join(result.get("missing_skills", [])),
                "suggested_next_skills": ", ".join(result.get("suggested_next_skills", [])),
                "skill_category": result.get("skill_category", ""),

                "suggestion_1": result.get("suggestions", ["", "", ""])[0] if len(result.get("suggestions", [])) > 0 else "",
                "suggestion_2": result.get("suggestions", ["", "", ""])[1] if len(result.get("suggestions", [])) > 1 else "",
                "suggestion_3": result.get("suggestions", ["", "", ""])[2] if len(result.get("suggestions", [])) > 2 else "",

            }

        )

        resume.status = "analyzed"
        resume.save()

        serializer = ResumeAnalysisSerializer(analysis)

        print("FINAL RESPONSE READY")

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
            {"error": "Resume ID is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        resume = Resume.objects.get(resume_id=resume_id)

        analysis = ResumeAnalysis.objects.get(resume=resume)

        profile = Candidate_Profile.objects.get(
             user=request.user
        )
        print("Candidate Profile Found")
        print("Candidate ID:", profile.candidate_id)

        print("Profile Email:", profile.user.email)
        print("Resume Email:", analysis.email)

        print("Profile Email Lower:", profile.user.email.strip().lower())
        print("Resume Email Lower:", analysis.email.strip().lower())
 
        # Email Validation
        if profile.user.email.strip().lower() != analysis.email.strip().lower():
               return Response(
                  {
                          "error": "Resume email does not match your profile email."
                  },
                  status=status.HTTP_400_BAD_REQUEST
    )

         # Name Validation
        print("Profile Name:", profile.user.full_name)
        print("Resume Name:", analysis.candidate_name)
        if profile.user.email.strip().lower() != analysis.email.strip().lower():
            return Response(
        {
            "error": "Resume email does not match your profile email."
        },
        status=status.HTTP_400_BAD_REQUEST
    )
        # Education
        profile.education = analysis.education

        # Location
        profile.location = analysis.location

        # Skills
        profile.skills = analysis.extracted_skills

        # Social Links
        profile.linkedin_url = analysis.linkedin
        profile.github_url = analysis.github
        profile.portfolio_url = analysis.portfolio

        # Experience
        
        
        try:
            import re

            experience_text = analysis.experience or ""

            print("Experience from Gemini:", experience_text)

            match = re.search(
                r"(\d+(\.\d+)?)\s*(year|years)",
                experience_text.lower()
            )

            if match:
                profile.experience_years = float(match.group(1))
            else:
                profile.experience_years = 0

        except Exception as e:
            print("Experience Error:", e)
            profile.experience_years = 0
            print("Resume Candidate ID:", resume.candidate_id)
            print("Profile Candidate ID:", profile.candidate_id)

            print("Education:", analysis.education)
            print("Location:", analysis.location)
            print("Skills:", analysis.extracted_skills)
            print("LinkedIn:", analysis.linkedin)
            print("Experience Years:", profile.experience_years)

        profile.save()
        print("Profile saved successfully")
       

        print("===== PROFILE SAVED =====")
        print("Education:", profile.education)
        print("Skills:", profile.skills)
        print("Location:", profile.location)
        print("LinkedIn:", profile.linkedin_url)
        print("GitHub:", profile.github_url)
        print("Portfolio:", profile.portfolio_url)
        print("Experience:", profile.experience_years)
  
        return Response(
            {
                "message": "Profile updated successfully"
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