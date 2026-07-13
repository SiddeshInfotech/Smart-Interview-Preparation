from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Resume, ResumeAnalysis
from .serializers import ResumeSerializer, ResumeAnalysisSerializer

from .resume_parser import extract_resume_text
from .gemini_service import analyze_resume_with_gemini

import os
from django.conf import settings



# Upload Resume API
@api_view(["POST"])
def upload_resume(request):

    resume_file = request.FILES.get("resume")
    candidate_id = request.data.get("candidate_id")


    if not resume_file:
        return Response(
            {
                "error": "Resume file is required"
            },
            status=status.HTTP_400_BAD_REQUEST
        )


    if not candidate_id:
        return Response(
            {
                "error": "Candidate ID is required"
            },
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


    # Save file physically
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





# View Resume API
@api_view(["GET"])
def view_resume(request):

    candidate_id = request.GET.get(
        "candidate_id"
    )


    if candidate_id:

        resumes = Resume.objects.filter(
            candidate_id=candidate_id
        )

    else:

        resumes = Resume.objects.all()



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





# Analyze Resume using Gemini AI
@api_view(["POST"])
def analyze_resume(request):

    resume_id = request.data.get(
        "resume_id"
    )


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

        # Processing status
        resume.status = "processing"
        resume.save()



        # Extract text from resume
        resume_text = extract_resume_text(
            resume.file_path
        )



        # Gemini Analysis
        result = analyze_resume_with_gemini(
            resume_text
        )



           
       
        
    
# Save or Update Analysis
       
        analysis, created = ResumeAnalysis.objects.update_or_create(

            resume=resume,

            defaults={

                "extracted_skills": ", ".join(
                    result.get("skills", [])
                ),

                "resume_score": result.get(
                    "resume_score",
                    0
                ),

                "summary": result.get(
                    "summary",
                    ""
                ),

                "suggestions": "\n".join(
                    result.get("suggestions", [])
                )
            }
        )
        # Update Resume status
        resume.status = "analyzed"
        resume.save()

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

        resume.status = "failed"
        resume.save()

        return Response(
            {
                "error": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Resume Score API
@api_view(["GET"])
def resume_score(request):

    resume_id = request.GET.get(
        "resume_id"
    )


    analysis = ResumeAnalysis.objects.filter(
        resume_id=resume_id
    ).first()



    if not analysis:

        return Response(

            {
                "error": "Analysis not found"
            },

            status=status.HTTP_404_NOT_FOUND
        )



    return Response(

        {
           "resume_score": analysis.resume_score
        },

        status=status.HTTP_200_OK
    )





# Resume Suggestions API
@api_view(["GET"])
def resume_suggestions(request):

    resume_id = request.GET.get(
        "resume_id"
    )


    analysis = ResumeAnalysis.objects.filter(
        resume_id=resume_id
    ).first()



    if not analysis:

        return Response(

            {
                "error": "Analysis not found"
            },

            status=status.HTTP_404_NOT_FOUND
        )



    return Response(

        {
            "suggestions": analysis.suggestions
        },

        status=status.HTTP_200_OK
    )