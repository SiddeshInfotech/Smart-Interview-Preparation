import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test.utils import setup_test_environment
from django.db import connection, transaction
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

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


def run_standalone_tests():
    print("\n==========================================")
    print("RUNNING COURSE & DOMAIN SYSTEM VERIFICATION")
    print("==========================================\n")

    setup_test_environment()

    # Use atomic transaction block so changes revert after test
    with transaction.atomic():
        # 1. Create test user
        user, _ = User.objects.get_or_create(
            email="test_standalone_domain@example.com",
            defaults={
                "full_name": "Test User",
                "role": "candidate",
            },
        )
        user.set_password("Password123!")
        user.save()

        candidate, _ = Candidate_Profile.objects.get_or_create(user=user)

        # 2. Retrieve domains seeded by seed_courses
        web_dev = Domain.objects.get(name="Web Development")
        game_dev = Domain.objects.get(name="Game Development")
        cyber_sec = Domain.objects.get(name="Cybersecurity")

        print("[OK] Domains retrieved successfully:")
        print(f"  - {web_dev.name}")
        print(f"  - {game_dev.name}")
        print(f"  - {cyber_sec.name}")

        # 3. Test API Client authentication
        client = APIClient()
        client.force_authenticate(user=user)

        # 4. Set active domain to Game Development
        res = client.put(
            "/api/profile/active-domain/",
            {"domain_id": game_dev.domain_id},
            format="json",
        )
        assert res.status_code == 200, f"Failed active domain switch: {res.data}"
        print("[OK] Active domain successfully switched to Game Development via API")

        candidate.refresh_from_db()
        assert candidate.active_domain == game_dev

        # 5. Get Game Dev courses (C# for Unity, C++ for Game Development, etc.)
        csharp_course = Course.objects.get(title="C# for Unity")
        unity_course = Course.objects.get(title="Game Physics")

        # Set specific progress percentages for Game Dev
        p_csharp, _ = CourseProgress.objects.get_or_create(
            candidate=candidate, domain=game_dev, course=csharp_course
        )
        p_csharp.progress_percentage = 56.0
        p_csharp.save()

        p_unity, _ = CourseProgress.objects.get_or_create(
            candidate=candidate, domain=game_dev, course=unity_course
        )
        p_unity.progress_percentage = 23.0
        p_unity.save()

        print(f"[OK] Initial Game Dev progress set: C# = {p_csharp.progress_percentage}%, Game Physics = {p_unity.progress_percentage}%")

        # 6. Switch to Cybersecurity
        res = client.put(
            "/api/profile/active-domain/",
            {"domain_id": cyber_sec.domain_id},
            format="json",
        )
        assert res.status_code == 200

        candidate.refresh_from_db()
        assert candidate.active_domain == cyber_sec
        print("[OK] Active domain successfully switched to Cybersecurity")

        # Verify Game Dev progress records still exist
        p_csharp_check = CourseProgress.objects.get(candidate=candidate, domain=game_dev, course=csharp_course)
        p_unity_check = CourseProgress.objects.get(candidate=candidate, domain=game_dev, course=unity_course)
        assert float(p_csharp_check.progress_percentage) == 56.0
        assert float(p_unity_check.progress_percentage) == 23.0
        print("[OK] Past Game Dev progress preserved (C# = 56%, Game Physics = 23%)")

        # Set Networking course progress under Cybersecurity
        net_course = Course.objects.get(title="Networking")
        p_net = CourseProgress.objects.get(candidate=candidate, domain=cyber_sec, course=net_course)
        p_net.progress_percentage = 30.0
        p_net.save()
        print("[OK] Cybersecurity progress set: Networking = 30%")

        # 7. Switch back to Game Development
        res = client.put(
            "/api/profile/active-domain/",
            {"domain_id": game_dev.domain_id},
            format="json",
        )
        assert res.status_code == 200

        candidate.refresh_from_db()
        assert candidate.active_domain == game_dev

        p_csharp_restored = CourseProgress.objects.get(candidate=candidate, domain=game_dev, course=csharp_course)
        p_unity_restored = CourseProgress.objects.get(candidate=candidate, domain=game_dev, course=unity_course)
        assert float(p_csharp_restored.progress_percentage) == 56.0
        assert float(p_unity_restored.progress_percentage) == 23.0
        print("[OK] Switched back to Game Dev: C# = 56%, Game Physics = 23% perfectly restored!")

        p_net_restored = CourseProgress.objects.get(candidate=candidate, domain=cyber_sec, course=net_course)
        assert float(p_net_restored.progress_percentage) == 30.0
        print("[OK] Cybersecurity Networking progress = 30% retained in background!")

        # 8. Test Topic completion calculation
        topic = CourseTopic.objects.filter(module__course=csharp_course).first()
        res = client.post(
            f"/api/topics/{topic.topic_id}/toggle-complete/",
            {"domain_id": game_dev.domain_id},
            format="json",
        )
        assert res.status_code == 200
        assert res.data["topic_completed"] is True
        print(f"[OK] Topic '{topic.title}' toggle completion API test passed! Course progress recalculated to {res.data['course_progress']}%")

        # Rollback transaction so test data leaves database clean
        transaction.set_rollback(True)

    print("\n==========================================")
    print("ALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("==========================================\n")


if __name__ == "__main__":
    run_standalone_tests()
