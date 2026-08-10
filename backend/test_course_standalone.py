import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test.utils import setup_test_environment
from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from candidate.models import Candidate_Profile
from course.models import (
    Domain,
    Course,
    CourseModule,
    CourseTopic,
    CourseProgress,
)
from course.services import recalculate_course_progress, switch_active_domain

User = get_user_model()


def run_standalone_tests():
    print("\n==========================================")
    print("RUNNING CONSOLIDATED 5-MODEL COURSE SYSTEM VERIFICATION")
    print("==========================================\n")

    setup_test_environment()

    with transaction.atomic():
        # 1. Create test user
        user, _ = User.objects.get_or_create(
            email="test_5model_domain@example.com",
            defaults={"full_name": "Test User 5Model", "role": "candidate"},
        )
        user.set_password("Password123!")
        user.save()

        candidate, _ = Candidate_Profile.objects.get_or_create(user=user)

        # 2. Retrieve domains seeded by seed_courses
        web_dev = Domain.objects.get(name="Web Development")
        game_dev = Domain.objects.get(name="Game Development")
        cyber_sec = Domain.objects.get(name="Cybersecurity")

        print("[OK] 5-Model Domains retrieved successfully:")
        print(f"  - {web_dev.name}")
        print(f"  - {game_dev.name}")
        print(f"  - {cyber_sec.name}")

        # 3. Dynamic Course Creation for Domains (Admin adding courses)
        csharp_course = Course.objects.create(
            domain=game_dev,
            title="C# for Unity",
            description="Complete C# Unity course",
            technology="C#",
            sequence=1,
            is_required=True,
        )
        physics_course = Course.objects.create(
            domain=game_dev,
            title="Game Physics",
            description="Physics for games",
            technology="Unity",
            sequence=2,
            is_required=False,
        )
        net_course = Course.objects.create(
            domain=cyber_sec,
            title="Networking Fundamentals",
            description="Networking course",
            technology="Networking",
            sequence=1,
            is_required=True,
        )

        mod_1 = CourseModule.objects.create(course=csharp_course, title="Module 1: C# Scripting", sequence=1)
        top_1 = CourseTopic.objects.create(module=mod_1, title="Variables & Data Types", sequence=1, pdf_title="Variables Notes")
        top_2 = CourseTopic.objects.create(module=mod_1, title="MonoBehaviour Lifecycle", sequence=2, pdf_title="MonoBehaviour Notes")

        print("[OK] Dynamic course, module, topic, and PDF material creation verified!")

        # 4. Test Bootstrap API Endpoint (/api/courses/bootstrap/)
        client = APIClient()
        client.force_authenticate(user=user)

        bootstrap_res = client.get("/api/courses/bootstrap/")
        assert bootstrap_res.status_code == 200, f"Bootstrap API failed: {bootstrap_res.data}"
        assert "active_domain" in bootstrap_res.data
        assert "available_domains" in bootstrap_res.data
        assert "performance" in bootstrap_res.data
        print(f"[OK] Bootstrap API (/api/courses/bootstrap/) executed in {bootstrap_res.data['performance']['response_time_ms']}ms with {bootstrap_res.data['performance']['queries_executed']} DB queries!")

        # 5. Set Game Development Active & Set Progress
        client.put("/api/profile/active-domain/", {"domain_id": game_dev.domain_id}, format="json")
        candidate.refresh_from_db()
        assert candidate.active_domain == game_dev

        p_csharp, _ = CourseProgress.objects.get_or_create(candidate=candidate, domain=game_dev, course=csharp_course)
        p_csharp.progress_percentage = 56.0
        p_csharp.save()

        p_physics, _ = CourseProgress.objects.get_or_create(candidate=candidate, domain=game_dev, course=physics_course)
        p_physics.progress_percentage = 23.0
        p_physics.save()

        print(f"[OK] Initial Game Dev progress set: C# = {p_csharp.progress_percentage}%, Game Physics = {p_physics.progress_percentage}%")

        # 6. Switch to Cybersecurity Domain
        client.put("/api/profile/active-domain/", {"domain_id": cyber_sec.domain_id}, format="json")
        candidate.refresh_from_db()
        assert candidate.active_domain == cyber_sec

        # Verify Game Dev progress records still exist
        p_csharp_check = CourseProgress.objects.get(candidate=candidate, domain=game_dev, course=csharp_course)
        p_physics_check = CourseProgress.objects.get(candidate=candidate, domain=game_dev, course=physics_course)
        assert float(p_csharp_check.progress_percentage) == 56.0
        assert float(p_physics_check.progress_percentage) == 23.0
        print("[OK] Past Game Dev progress preserved (C# = 56%, Game Physics = 23%)")

        # Set Cybersecurity progress
        p_net = CourseProgress.objects.get(candidate=candidate, domain=cyber_sec, course=net_course)
        p_net.progress_percentage = 30.0
        p_net.save()

        # 7. Switch back to Game Development
        client.put("/api/profile/active-domain/", {"domain_id": game_dev.domain_id}, format="json")
        candidate.refresh_from_db()
        assert candidate.active_domain == game_dev

        p_csharp_restored = CourseProgress.objects.get(candidate=candidate, domain=game_dev, course=csharp_course)
        p_physics_restored = CourseProgress.objects.get(candidate=candidate, domain=game_dev, course=physics_course)
        assert float(p_csharp_restored.progress_percentage) == 56.0
        assert float(p_physics_restored.progress_percentage) == 23.0
        print("[OK] Switched back to Game Dev: C# = 56%, Game Physics = 23% perfectly restored!")

        p_net_restored = CourseProgress.objects.get(candidate=candidate, domain=cyber_sec, course=net_course)
        assert float(p_net_restored.progress_percentage) == 30.0
        print("[OK] Cybersecurity Networking progress = 30% retained in background!")

        # 8. Test Topic Toggle Completion API with JSON completed_topic_ids
        toggle_res = client.post(f"/api/topics/{top_1.topic_id}/toggle-complete/", format="json")
        assert toggle_res.status_code == 200
        assert toggle_res.data["topic_completed"] is True
        assert toggle_res.data["course_progress"] == 50.0
        print(f"[OK] Topic toggle API test passed! Topic completion updated via JSON array and progress recalculated to 50.0%!")

        # Rollback transaction so DB remains clean
        transaction.set_rollback(True)

    print("\n==========================================")
    print("ALL 5-MODEL CONSOLIDATED VERIFICATION TESTS PASSED!")
    print("==========================================\n")


if __name__ == "__main__":
    run_standalone_tests()
