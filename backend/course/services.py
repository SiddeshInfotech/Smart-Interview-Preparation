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



def resolve_domain_by_name(target_name):
    if not target_name:
        return None
    target_norm = str(target_name).strip()
    if not target_norm:
        return None

    # 1. Exact match
    domain = Domain.objects.filter(name__iexact=target_norm, is_active=True).first()
    if domain:
        return domain

    # 2. Key phrase matching
    lower = target_norm.lower()
    if "web" in lower or "full stack" in lower:
        d = Domain.objects.filter(name__icontains="Web", is_active=True).first()
        if d:
            return d
    if "data" in lower:
        d = Domain.objects.filter(name__icontains="Data Science", is_active=True).first() or Domain.objects.filter(name__icontains="Data", is_active=True).first()
        if d:
            return d
    if "test" in lower or "qa" in lower:
        d = Domain.objects.filter(name__icontains="Software Testing", is_active=True).first() or Domain.objects.filter(name__icontains="Testing", is_active=True).first()
        if d:
            return d
    if "mobile" in lower or "android" in lower:
        d = Domain.objects.filter(name__icontains="Mobile", is_active=True).first()
        if d:
            return d
    if "cyber" in lower or "security" in lower:
        d = Domain.objects.filter(name__icontains="Cyber", is_active=True).first()
        if d:
            return d
    if "game" in lower:
        d = Domain.objects.filter(name__icontains="Game", is_active=True).first()
        if d:
            return d

    # 3. Fallback to first word
    words = target_norm.split()
    if words:
        d = Domain.objects.filter(name__icontains=words[0], is_active=True).first()
        if d:
            return d

    return Domain.objects.filter(is_active=True).first()


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
