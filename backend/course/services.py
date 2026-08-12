from django.utils import timezone
from .models import (
    Domain,
    Course,
    CourseModule,
    CourseProgress,
)


def recalculate_course_progress(candidate, domain, course):
    """
    Recalculate course progress percentage based on completed_module_ids JSON array.
    """
    active_module_ids = list(
        CourseModule.objects.filter(
            course=course,
            is_active=True,
        ).values_list("module_id", flat=True)
    )

    total_modules = len(active_module_ids)

    progress, created = CourseProgress.objects.get_or_create(
        candidate=candidate,
        domain=domain,
        course=course,
        defaults={"progress_percentage": 0.0, "completed_module_ids": []},
    )

    completed_ids = [m_id for m_id in (progress.completed_module_ids or []) if m_id in active_module_ids]

    if total_modules == 0:
        pct = 0.0
    else:
        pct = round((len(completed_ids) / float(total_modules)) * 100.0, 2)

    progress.completed_module_ids = completed_ids
    progress.progress_percentage = pct
    if pct >= 100.0 and not progress.completed:
        progress.completed = True
        progress.completed_at = timezone.now()
    elif pct < 100.0 and progress.completed:
        progress.completed = False
        progress.completed_at = None

    progress.save()
    return progress



def switch_active_domain(candidate, target_domain):
    """
    Switch candidate active domain and initialize missing CourseProgress records at 0%.
    Preserves all existing progress records across all domains.
    """
    candidate.active_domain = target_domain
    candidate.save(update_fields=["active_domain"])

    # Get active courses for target domain
    domain_courses = Course.objects.filter(
        domain=target_domain,
        is_active=True,
    ).order_by("sequence", "course_id")

    # Initialize missing progress records for target domain
    for course in domain_courses:
        CourseProgress.objects.get_or_create(
            candidate=candidate,
            domain=target_domain,
            course=course,
            defaults={"progress_percentage": 0.0, "completed_module_ids": []},
        )

    return domain_courses
