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

    # Fetch all active domains in 1 fast DB query
    active_domains = list(Domain.objects.filter(is_active=True))
    if not active_domains:
        return None

    # 1. Exact match (case-insensitive)
    for d in active_domains:
        if d.name.lower() == target_norm.lower():
            return d

    # 2. Key phrase matching in memory
    lower = target_norm.lower()
    if "web" in lower or "full stack" in lower:
        for d in active_domains:
            if "web" in d.name.lower():
                return d
    if "data" in lower:
        for d in active_domains:
            if "data science" in d.name.lower() or "data" in d.name.lower():
                return d
    if "test" in lower or "qa" in lower:
        for d in active_domains:
            if "software testing" in d.name.lower() or "testing" in d.name.lower():
                return d
    if "mobile" in lower or "android" in lower:
        for d in active_domains:
            if "mobile" in d.name.lower():
                return d
    if "cyber" in lower or "security" in lower:
        for d in active_domains:
            if "cyber" in d.name.lower():
                return d
    if "game" in lower:
        for d in active_domains:
            if "game" in d.name.lower():
                return d

    # 3. Fallback to first word match
    words = target_norm.split()
    if words:
        first_word = words[0].lower()
        for d in active_domains:
            if first_word in d.name.lower():
                return d

    return active_domains[0]


def switch_active_domain(candidate, target_domain):
    """
    Switch candidate active domain and initialize missing CourseProgress records at 0%.
    Preserves all existing progress records across all domains.
    Optimized with single bulk operations.
    """
    if not target_domain:
        return []

    # If domain hasn't changed, skip extra DB updates
    if candidate.active_domain_id == target_domain.domain_id:
        return Course.objects.filter(domain=target_domain, is_active=True).order_by("sequence", "course_id")

    candidate.active_domain = target_domain
    candidate.save(update_fields=["active_domain"])

    domain_courses = list(Course.objects.filter(
        domain=target_domain,
        is_active=True,
    ).order_by("sequence", "course_id"))

    if not domain_courses:
        return []

    # Efficiently bulk-create missing progress records in 1 query
    existing_course_ids = set(
        CourseProgress.objects.filter(
            candidate=candidate,
            domain=target_domain
        ).values_list("course_id", flat=True)
    )

    new_progress_objs = [
        CourseProgress(
            candidate=candidate,
            domain=target_domain,
            course=course,
            progress_percentage=0.0,
            completed_module_ids=[]
        )
        for course in domain_courses
        if course.course_id not in existing_course_ids
    ]

    if new_progress_objs:
        CourseProgress.objects.bulk_create(new_progress_objs, ignore_conflicts=True)

    return domain_courses
