from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from candidate.models import Candidate_Profile
from course.models import (
    Domain,
    Technology,
    Course,
    DomainCourse,
    CourseModule,
    CourseTopic,
    CourseMaterial,
    CourseProgress,
    CandidateTopicProgress,
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

        # 3. Setup Technologies
        self.tech_csharp = Technology.objects.create(name="C#")
        self.tech_python = Technology.objects.create(name="Python")
        self.tech_network = Technology.objects.create(name="Networking")

        # 4. Setup Courses for Game Dev
        self.csharp_course = Course.objects.create(
            title="C# for Unity",
            description="C# course",
            technology=self.tech_csharp,
        )
        DomainCourse.objects.create(
            domain=self.game_dev, course=self.csharp_course, sequence=1
        )

        self.unity_course = Course.objects.create(
            title="Unity Engine",
            description="Unity course",
            technology=self.tech_csharp,
        )
        DomainCourse.objects.create(
            domain=self.game_dev, course=self.unity_course, sequence=2
        )

        # 5. Setup Courses for Cybersecurity
        self.networking_course = Course.objects.create(
            title="Networking Fundamentals",
            description="Networking course",
            technology=self.tech_network,
        )
        DomainCourse.objects.create(
            domain=self.cyber_security, course=self.networking_course, sequence=1
        )

        # 6. Add Modules & Topics to C# Course (Total 10 topics for easy % test)
        self.module_1 = CourseModule.objects.create(
            course=self.csharp_course, title="Module 1: C# Fundamentals", sequence=1
        )
        self.topics = []
        for i in range(1, 11):
            top = CourseTopic.objects.create(
                module=self.module_1, title=f"Topic {i}", sequence=i
            )
            self.topics.append(top)

        # Add Course Material to Topic 1
        pdf_file = SimpleUploadedFile(
            "sample.pdf",
            b"%PDF-1.4 ... dummy content ...",
            content_type="application/pdf",
        )
        self.material_1 = CourseMaterial.objects.create(
            topic=self.topics[0],
            title="Sample PDF Material",
            file=pdf_file,
            material_type="PDF",
        )

        # API Client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_pdf_validation(self):
        """Test invalid file extension rejected."""
        invalid_file = SimpleUploadedFile(
            "bad.exe", b"executable content", content_type="application/octet-stream"
        )
        mat = CourseMaterial(
            topic=self.topics[0],
            title="Invalid File Test",
            file=invalid_file,
        )
        with self.assertRaises(Exception):
            mat.full_clean()

    def test_topic_progress_recalculation(self):
        """Test topic completion percentage calculation."""
        # Complete 6 out of 10 topics in C# course for Game Dev domain
        for i in range(6):
            CandidateTopicProgress.objects.create(
                candidate=self.candidate,
                domain=self.game_dev,
                topic=self.topics[i],
                completed=True,
            )

        prog = recalculate_course_progress(
            self.candidate, self.game_dev, self.csharp_course
        )
        self.assertEqual(float(prog.progress_percentage), 60.0)

    def test_section_33_domain_switch_preservation(self):
        """
        Exact test specified in Section 33 of prompt:
        1. Select Game Development domain.
        2. Set progress: C# = 56%, Unity = 23%.
        3. Switch candidate to Cybersecurity.
        4. Verify Game Development progress still exists.
        5. Create Cybersecurity progress (Networking = 30%).
        6. Switch back to Game Development.
        7. Verify C# = 56%, Unity = 23%.
        8. Verify Networking remains 30%.
        """
        # Step 1 & 2: Set Game Dev active & progress
        self.candidate.active_domain = self.game_dev
        self.candidate.save()

        p_csharp = CourseProgress.objects.create(
            candidate=self.candidate,
            domain=self.game_dev,
            course=self.csharp_course,
            progress_percentage=56.0,
        )
        p_unity = CourseProgress.objects.create(
            candidate=self.candidate,
            domain=self.game_dev,
            course=self.unity_course,
            progress_percentage=23.0,
        )

        # Step 3: Switch candidate to Cybersecurity
        response = self.client.put(
            "/api/profile/active-domain/",
            {"domain_id": self.cyber_security.domain_id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.active_domain, self.cyber_security)

        # Step 4: Verify Game Development progress still exists
        self.assertTrue(
            CourseProgress.objects.filter(
                candidate=self.candidate,
                domain=self.game_dev,
                course=self.csharp_course,
                progress_percentage=56.0,
            ).exists()
        )
        self.assertTrue(
            CourseProgress.objects.filter(
                candidate=self.candidate,
                domain=self.game_dev,
                course=self.unity_course,
                progress_percentage=23.0,
            ).exists()
        )

        # Step 5: Update Cybersecurity Networking course progress to 30%
        p_net = CourseProgress.objects.get(
            candidate=self.candidate,
            domain=self.cyber_security,
            course=self.networking_course,
        )
        p_net.progress_percentage = 30.0
        p_net.save()

        # Step 6: Switch back to Game Development
        response = self.client.put(
            "/api/profile/active-domain/",
            {"domain_id": self.game_dev.domain_id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.candidate.refresh_from_db()
        self.assertEqual(self.candidate.active_domain, self.game_dev)

        # Step 7: Verify Game Dev progress intact
        p_csharp_after = CourseProgress.objects.get(
            candidate=self.candidate,
            domain=self.game_dev,
            course=self.csharp_course,
        )
        p_unity_after = CourseProgress.objects.get(
            candidate=self.candidate,
            domain=self.game_dev,
            course=self.unity_course,
        )
        self.assertEqual(float(p_csharp_after.progress_percentage), 56.0)
        self.assertEqual(float(p_unity_after.progress_percentage), 23.0)

        # Step 8: Verify Networking progress remains 30% in Cybersecurity
        p_net_after = CourseProgress.objects.get(
            candidate=self.candidate,
            domain=self.cyber_security,
            course=self.networking_course,
        )
        self.assertEqual(float(p_net_after.progress_percentage), 30.0)
