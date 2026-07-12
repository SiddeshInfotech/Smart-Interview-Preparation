from rest_framework import generics, permissions
from .models import Skill  
from .serializers import SkillSerializer

class SkillSearchAPIView(generics.ListAPIView):
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Skill.objects.filter(is_active=True)
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(skill_name__icontains=search)
        return queryset[:10]