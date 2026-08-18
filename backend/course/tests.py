import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from candidate.models import Candidate_Profile
from course.models import (
    Domain,
    Course,
    CourseModule,
)
from course.services import switch_active_domain

User = get_user_model()


class CourseSystemTests(TestCase):
    def setUp(self):
        self.user, _ = User.objects.get_or_create(
            email="candidate_test@example.com",
            defaults={
                "full_name": "Aditya Candidate",
                "role": "candidate",
            }
        )
        self.candidate, _ = Candidate_Profile.objects.get_or_create(user=self.user)

        # 2. Setup Domains
        self.web_dev = Domain.objects.create(
            name="Web Development", description="Web dev domain"
        )
        self.game_dev = Domain.objects.create(
            name="Game Development", description="Game dev domain"
        )
        self.cyber_security = Domain.objects.create(
            name="Cybersecurity", description="Cybersecurity domain"
        )

        # 3. Setup Courses
        self.csharp_course = Course.objects.create(
            domain=self.game_dev,
            title="C# for Unity",
            description="C# course",
            technology="C#",
            sequence=1,
        )

        self.unity_course = Course.objects.create(
            domain=self.game_dev,
            title="Unity Engine",
            description="Unity course",
            technology="Unity",
            sequence=2,
        )

        self.networking_course = Course.objects.create(
            domain=self.cyber_security,
            title="Networking Fundamentals",
            description="Networking course",
            technology="Networking",
            sequence=1,
        )

        # 4. Add Modules to C# Course
        self.modules = []
        for i in range(1, 11):
            mod = CourseModule.objects.create(
                course=self.csharp_course,
                title=f"Module {i}",
                sequence=i,
            )
            self.modules.append(mod)

        # API Client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_pdf_validation(self):
        """Test invalid file extension rejected."""
        invalid_file = SimpleUploadedFile(
            "bad.exe", b"executable content", content_type="application/octet-stream"
        )
        mod = CourseModule(
            course=self.csharp_course,
            title="Invalid File Test",
            pdf_file=invalid_file,
        )
        with self.assertRaises(Exception):
            mod.full_clean()

    def test_domain_switch(self):
        """Test active domain switching."""
        self.candidate.active_domain = self.game_dev
        self.candidate.save()

        response = self.client.put(
            "/api/courses/active-domain/",
            {"domain_id": self.cyber_security.domain_id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.active_domain, self.cyber_security)
