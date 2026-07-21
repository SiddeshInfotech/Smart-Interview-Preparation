from rest_framework import serializers
from .models import Interviewer_Profile, InterviewerAvailability


class InterviewerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interviewer_Profile
        fields = [
            'interviewer_id', 'profile_picture', 'department', 'designation',
            'expertise_area', 'years_of_experience', 'is_available',
        ]
        read_only_fields = ['interviewer_id']


class InterviewerSearchSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = Interviewer_Profile
        fields = [
            "interviewer_id",
            "full_name",
            "email",
            "profile_picture",
            "department",
            "designation",
            "expertise_area",
            "years_of_experience",
            "is_available",
        ]
        read_only_fields = fields

    def get_profile_picture(self, obj):
        if not obj.profile_picture:
            return None
        request = self.context.get("request")
        picture_url = obj.profile_picture.url
        if request is not None:
            return request.build_absolute_uri(picture_url)
        return picture_url


class InterviewerAvailabilitySerializer(serializers.ModelSerializer):
    # Add nested fields to show interviewer details
    interviewer_name = serializers.CharField(source='interviewer.user.full_name', read_only=True)
    interviewer_designation = serializers.CharField(source='interviewer.designation', read_only=True)

    class Meta:
        model = InterviewerAvailability
        fields = [
            'availability_id',
            'interviewer',
            'interviewer_name',
            'interviewer_designation',
            'start_time',
            'end_time',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['availability_id', 'created_at', 'updated_at']