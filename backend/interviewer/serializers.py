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
        read_only_fields = ['availability_id', 'interviewer', 'created_at', 'updated_at']

    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if start_time and end_time:
            if end_time <= start_time:
                raise serializers.ValidationError({"end_time": "End time must be after start time."})
            
            # Get interviewer profile from the request context
            request = self.context.get('request')
            if request and hasattr(request, 'user') and hasattr(request.user, 'interviewer_profile'):
                interviewer = request.user.interviewer_profile
                
                # Check for overlapping slots
                overlapping = InterviewerAvailability.objects.filter(
                    interviewer=interviewer,
                    start_time__lt=end_time,
                    end_time__gt=start_time
                )
                
                if self.instance:
                    overlapping = overlapping.exclude(pk=self.instance.pk)
                    
                if overlapping.exists():
                    raise serializers.ValidationError("This availability slot overlaps with an existing slot.")
        
        return data