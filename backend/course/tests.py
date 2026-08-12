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
    CourseProgress,
)
from course.services import recalculate_course_progress, switch_active_domain

User = get_user_model()


class CourseSystemTests(TestCase):
    def setUp(self):
        # 1. Create candidate user
        self.user = User.objects.create_user(
            email="candidate_test@example.com",
            full_name="Aditya Candidate",
            password="StrongPassword123!",
            role="candidate",
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

    def test_module_progress_recalculation(self):
        """Test module completion percentage calculation."""
        # Complete 6 out of 10 modules in C# course for Game Dev domain
        completed_ids = [m.module_id for m in self.modules[:6]]
        prog = CourseProgress.objects.create(
            candidate=self.candidate,
            domain=self.game_dev,
            course=self.csharp_course,
            completed_module_ids=completed_ids,
        )
        recalculated_prog = recalculate_course_progress(
            self.candidate, self.game_dev, self.csharp_course
        )
        self.assertEqual(float(recalculated_prog.progress_percentage), 60.0)

    def test_domain_switch_preservation(self):
        """
        Test domain switching preserves individual domain progress.
        """
        # Set Game Dev active & progress
        self.candidate.active_domain = self.game_dev
        self.candidate.save()

        CourseProgress.objects.create(
            candidate=self.candidate,
            domain=self.game_dev,
            course=self.csharp_course,
            progress_percentage=56.0,
        )
        CourseProgress.objects.create(
            candidate=self.candidate,
            domain=self.game_dev,
            course=self.unity_course,
            progress_percentage=23.0,
        )

        # Switch candidate to Cybersecurity
        response = self.client.put(
            "/api/courses/active-domain/",
            {"domain_id": self.cyber_security.domain_id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.active_domain, self.cyber_security)

        # Verify Game Development progress still exists
        self.assertTrue(
            CourseProgress.objects.filter(
                candidate=self.candidate,
                domain=self.game_dev,
                course=self.csharp_course,
                progress_percentage=56.0,
            ).exists()
        )

        # Update Cybersecurity Networking course progress to 30%
        p_net = CourseProgress.objects.get(
            candidate=self.candidate,
            domain=self.cyber_security,
            course=self.networking_course,
        )
        p_net.progress_percentage = 30.0
        p_net.save()

        # Switch back to Game Development
        response = self.client.put(
            "/api/courses/active-domain/",
            {"domain_id": self.game_dev.domain_id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.active_domain, self.game_dev)

        # Verify Game Dev progress intact
        p_csharp_after = CourseProgress.objects.get(
            candidate=self.candidate,
            domain=self.game_dev,
            course=self.csharp_course,
        )
        self.assertEqual(float(p_csharp_after.progress_percentage), 56.0)
