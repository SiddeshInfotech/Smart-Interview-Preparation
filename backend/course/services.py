from .models import (
    Domain,
    Course,
    CourseModule,
)


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
    Switch candidate active domain.
    """
    if not target_domain:
        return []

    if candidate.active_domain_id == target_domain.domain_id:
        return Course.objects.filter(domain=target_domain, is_active=True).order_by("sequence", "course_id")

    candidate.active_domain = target_domain
    candidate.save(update_fields=["active_domain"])

    try:
        from dashboard.services import clear_dashboard_services_cache
        clear_dashboard_services_cache(candidate.user)
    except Exception:
        pass

    return list(Course.objects.filter(
        domain=target_domain,
        is_active=True,
    ).order_by("sequence", "course_id"))
