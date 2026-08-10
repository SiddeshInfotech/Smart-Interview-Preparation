from django.utils import timezone
from .models import (
    Domain,
    Course,
    DomainCourse,
    CourseModule,
    CourseTopic,
    CourseProgress,
    CandidateTopicProgress,
)


def recalculate_course_progress(candidate, domain, course):
    """
    Recalculate course progress percentage for candidate in domain based on completed topics.
    """
    total_topics = CourseTopic.objects.filter(
        module__course=course,
        module__is_active=True,
        is_active=True,
    ).count()

    if total_topics == 0:
        pct = 0.0
    else:
        completed_topics_count = CandidateTopicProgress.objects.filter(
            candidate=candidate,
            domain=domain,
            topic__module__course=course,
            topic__module__is_active=True,
            topic__is_active=True,
            completed=True,
        ).count()

        pct = round((completed_topics_count / total_topics) * 100.0, 2)

    progress, created = CourseProgress.objects.get_or_create(
        candidate=candidate,
        domain=domain,
        course=course,
        defaults={"progress_percentage": pct},
    )

    if not created or progress.progress_percentage != pct:
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
    Switch active domain for candidate and initialize missing CourseProgress records at 0%.
    Preserves all existing progress records across all domains.
    """
    candidate.active_domain = target_domain
    candidate.save(update_fields=["active_domain"])

    # Get all active courses for target domain
    domain_courses = DomainCourse.objects.filter(
        domain=target_domain,
        course__is_active=True,
    ).select_related("course")

    # Initialize missing progress records for the target domain
    for dc in domain_courses:
        CourseProgress.objects.get_or_create(
            candidate=candidate,
            domain=target_domain,
            course=dc.course,
            defaults={"progress_percentage": 0.0},
        )

    return domain_courses
