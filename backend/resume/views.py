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

        # Determine target domain from request body or candidate profile
        req_domain = request.data.get("target_domain")
        profile = Candidate_Profile.objects.filter(candidate_id=resume.candidate_id).first()
        if not profile and request.user and request.user.is_authenticated:
            profile = Candidate_Profile.objects.filter(user=request.user).first()

        target_domain = (req_domain or (profile.target_domain if profile else "") or "").strip()

        # OpenRouter / Gemini AI
        result = analyze_resume_ai(resume_text, target_domain)
        print("3. AI response received for domain:", target_domain)

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

        # Check domain match & force resume_score to 0 if details do not match selected target domain
        is_matched = bool(result.get("domain_match_status")) and (int(result.get("domain_match_score") or 0) >= 60)
        try:
            score_val = int(result.get("resume_score", 0))
        except Exception:
            score_val = 0

        if not is_matched:
            score_val = 0

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
                "target_domain": str(result.get("target_domain") or target_domain).strip(),
                "domain_match_score": int(result.get("domain_match_score") or (80 if is_matched else 0)),
                "domain_match_status": is_matched,
                "domain_match_feedback": str(result.get("domain_match_feedback") or "").strip(),
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

        # Flag newly uploaded resume as active if content matches candidate's selected domain
        resume.status = "analyzed"
        if is_matched:
            resume.is_active = True
            resume.save()
            # Set all other resumes for this candidate to inactive
            Resume.objects.filter(candidate_id=resume.candidate_id).exclude(resume_id=resume.resume_id).update(is_active=False)
        else:
            resume.is_active = False
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