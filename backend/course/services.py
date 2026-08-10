from django.utils import timezone
from .models import (
    Domain,
    Course,
    CourseModule,
    CourseTopic,
    CourseProgress,
)


def recalculate_course_progress(candidate, domain, course):
    """
    Recalculate course progress percentage based on completed_topic_ids JSON array.
    """
    active_topic_ids = list(
        CourseTopic.objects.filter(
            module__course=course,
            module__is_active=True,
            is_active=True,
        ).values_list("topic_id", flat=True)
    )

    total_topics = len(active_topic_ids)

    progress, created = CourseProgress.objects.get_or_create(
        candidate=candidate,
        domain=domain,
        course=course,
        defaults={"progress_percentage": 0.0, "completed_topic_ids": []},
    )

    completed_ids = [t_id for t_id in (progress.completed_topic_ids or []) if t_id in active_topic_ids]

    if total_topics == 0:
        pct = 0.0
    else:
        pct = round((len(completed_ids) / float(total_topics)) * 100.0, 2)

    progress.completed_topic_ids = completed_ids
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
            defaults={"progress_percentage": 0.0, "completed_topic_ids": []},
        )

    return domain_courses
