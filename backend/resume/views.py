from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Resume, ResumeAnalysis
from .serializers import ResumeSerializer, ResumeAnalysisSerializer

from .resume_parser import extract_resume_text
from ai.resume_service import analyze_resume as analyze_resume_ai

from candidate.models import Candidate_Profile

import os
from django.conf import settings


# Helper for cleaning URL fields
def safe_url(val):
    if not val or not isinstance(val, str):
        return None
    v = val.strip()
    if not v or v.lower() in ["n/a", "none", "not provided", "null", "-", "undefined", "no", "false"]:
        return None
    if not (v.startswith("http://") or v.startswith("https://")):
        if "." in v and " " not in v:
            return "https://" + v
        return None
    return v[:200]


# ==========================
# Upload Resume API
# ==========================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_resume(request):

    resume_file = request.FILES.get("resume")

    profile, _ = Candidate_Profile.objects.get_or_create(user=request.user)
    candidate_id = profile.candidate_id

    if not resume_file:
        return Response(
            {"error": "Resume file is required"}, status=status.HTTP_400_BAD_REQUEST
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
        status="uploaded",
    )

    serializer = ResumeSerializer(resume)

    return Response(
        {"message": "Resume uploaded successfully", "data": serializer.data},
        status=status.HTTP_201_CREATED,
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
        {"message": "Resume retrieved successfully", "data": serializer.data},
        status=status.HTTP_200_OK,
    )


# ==========================
# Analyze Resume API
# ==========================
@api_view(["POST"])
def analyze_resume(request):

    resume_id = request.data.get("resume_id")

    if not resume_id:
        return Response(
            {"error": "Resume ID is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        resume = Resume.objects.get(resume_id=resume_id)

    except Resume.DoesNotExist:
        return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)

    # ── Free-tier monthly limit via UserCredit database model ──────────────
    try:
        profile = Candidate_Profile.objects.filter(candidate_id=resume.candidate_id).first()
        user = profile.user if profile else (request.user if request.user and request.user.is_authenticated else None)

        if user and not user.has_premium:
            from authentication.models import UserCredit
            credits_obj, _ = UserCredit.objects.get_or_create(user=user)
            credits_obj.check_and_reset()

            if credits_obj.resume_used >= credits_obj.resume_limit:
                return Response(
                    {
                        "error": "Monthly resume analysis limit reached.",
                        "detail": f"Free users can analyze up to {credits_obj.resume_limit} resumes per month. Upgrade to Premium for unlimited access.",
                        "limit_reached": True,
                    },
                    status=429,
                )
    except Exception as limit_err:
        print("Resume limit check error:", limit_err)
    # ──────────────────────────────────────────────────────────────────────

    try:

        # Processing
        resume.status = "processing"
        resume.save()

        print("1. Resume found")

        # Extract text
        resume_text = extract_resume_text(resume.file_path)
        if not resume_text or not resume_text.strip():
            resume_text = f"Resume document: {resume.file_name}"
        print("2. Resume text extracted")

        # Gemini
        result = analyze_resume_ai(resume_text)
        print("3. Gemini response received")

        print("GEMINI RESULT:", result)

        def safe_join(val):
            if isinstance(val, list):
                return ", ".join([str(x).strip() for x in val if x])
            if isinstance(val, str):
                return val.strip()
            return ""

        raw_sug = result.get("suggestions")
        if isinstance(raw_sug, list):
            sug_list = [str(x).strip() for x in raw_sug if x]
        elif isinstance(raw_sug, str) and raw_sug.strip():
            sug_list = [raw_sug.strip()]
        else:
            sug_list = []

        s1 = sug_list[0] if len(sug_list) > 0 else ""
        s2 = sug_list[1] if len(sug_list) > 1 else ""
        s3 = sug_list[2] if len(sug_list) > 2 else ""

        try:
            score_val = int(result.get("resume_score", 75))
        except Exception:
            score_val = 75

        analysis, created = ResumeAnalysis.objects.update_or_create(
            resume=resume,
            defaults={
                "role": str(result.get("role") or "").strip(),
                "experience": str(result.get("experience") or "").strip(),
                "candidate_name": str(result.get("candidate_name") or "").strip(),
                "email": str(result.get("email") or "").strip(),
                "education": str(result.get("education") or "").strip(),
                "location": str(result.get("location") or "").strip(),
                "linkedin": safe_url(result.get("linkedin")),
                "github": safe_url(result.get("github")),
                "portfolio": safe_url(result.get("portfolio")),
                "summary": str(result.get("summary") or "").strip(),
                "resume_score": score_val,
                "extracted_skills": safe_join(result.get("skills")),
                "matched_skills": safe_join(result.get("matched_skills")),
                "missing_skills": safe_join(result.get("missing_skills")),
                "suggested_next_skills": safe_join(result.get("suggested_next_skills")),
                "skill_category": str(result.get("skill_category") or "").strip(),
                "suggestion_1": s1,
                "suggestion_2": s2,
                "suggestion_3": s3,
            },
        )

        resume.status = "analyzed"
        resume.save()

        if user:
            try:
                from authentication.models import UserCredit
                from authentication.services import invalidate_usage_cache
                credits_obj, _ = UserCredit.objects.get_or_create(user=user)
                credits_obj.check_and_reset()
                credits_obj.resume_used += 1
                credits_obj.save(update_fields=["resume_used", "updated_at"])
                invalidate_usage_cache(user.id)
            except Exception:
                pass

        serializer = ResumeAnalysisSerializer(analysis)

        print("FINAL RESPONSE READY")

        return Response(
            {"message": "Resume analyzed successfully", "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    except Exception as e:

        print("ANALYZE ERROR:", str(e))

        resume.status = "failed"
        resume.save()

        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================
# Resume Score API
# ==========================
@api_view(["GET"])
def resume_score(request):

    resume_id = request.GET.get("resume_id")

    try:

        analysis = ResumeAnalysis.objects.get(resume__resume_id=resume_id)

        return Response(
            {"resume_score": analysis.resume_score}, status=status.HTTP_200_OK
        )

    except ResumeAnalysis.DoesNotExist:

        return Response(
            {"error": "Analysis not found"}, status=status.HTTP_404_NOT_FOUND
        )


# ==========================
# Resume Suggestions API
# ==========================
@api_view(["GET"])
def resume_suggestions(request):

    resume_id = request.GET.get("resume_id")

    try:

        analysis = ResumeAnalysis.objects.get(resume__resume_id=resume_id)

        return Response(
            {
                "suggestion_1": analysis.suggestion_1,
                "suggestion_2": analysis.suggestion_2,
                "suggestion_3": analysis.suggestion_3,
            },
            status=status.HTTP_200_OK,
        )

    except ResumeAnalysis.DoesNotExist:

        return Response(
            {"error": "Analysis not found"}, status=status.HTTP_404_NOT_FOUND
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
            {"error": "Resume ID is required"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:

        resume = Resume.objects.get(resume_id=resume_id)

        analysis = ResumeAnalysis.objects.get(resume=resume)

        # Verify candidate profile ownership
        profile, _ = Candidate_Profile.objects.get_or_create(user=request.user)

        # Education
        if analysis.education:
            profile.education = analysis.education

        # Location
        if analysis.location:
            profile.location = analysis.location

        # Skills
        if analysis.extracted_skills:
            profile.skills = analysis.extracted_skills

        # Social Links
        if analysis.linkedin:
            profile.linkedin_url = safe_url(analysis.linkedin) or profile.linkedin_url
        if analysis.github:
            profile.github_url = safe_url(analysis.github) or profile.github_url
        if analysis.portfolio:
            profile.portfolio_url = safe_url(analysis.portfolio) or profile.portfolio_url

        # Experience

        try:
            import re

            experience_text = analysis.experience or ""

            print("Experience from Gemini:", experience_text)

            match = re.search(r"(\d+(\.\d+)?)\s*(year|years)", experience_text.lower())

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
        try:
            from candidate.services import invalidate_candidate_profile_cache
            from authentication.services import invalidate_auth_profile_cache
            user_id = getattr(request.user, "pk", getattr(request.user, "user_id", None))
            if user_id:
                invalidate_candidate_profile_cache(user_id)
                invalidate_auth_profile_cache(user_id)
        except Exception:
            pass
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
            {"message": "Profile updated successfully"}, status=status.HTTP_200_OK
        )

    except Resume.DoesNotExist:
        return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)

    except ResumeAnalysis.DoesNotExist:
        return Response(
            {"error": "Resume is not analyzed"}, status=status.HTTP_404_NOT_FOUND
        )

    except Candidate_Profile.DoesNotExist:
        return Response(
            {"error": "Candidate profile not found"}, status=status.HTTP_404_NOT_FOUND
        )