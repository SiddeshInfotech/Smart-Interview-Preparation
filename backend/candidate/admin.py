from django.contrib import admin
from django.utils.html import format_html
from .models import Candidate_Profile

@admin.register(Candidate_Profile)
class CandidateProfileAdmin(admin.ModelAdmin):
    # ---------- LIST VIEW ----------
    # Show ALL fields in the table (except very long text fields like 'skills' – but we include them with truncation)
    list_display = (
        "candidate_id",
        "user_email",
        "profile_picture_preview",   # shows thumbnail
        "target_domain",
        "gender",
        "location",
        "education",
        "experience_years",
        "skills_preview",            # truncated version
        "linkedin_url",
        "github_url",
        "portfolio_url",
        "date_of_birth",
        "created_at",
        "updated_at",
    )
    list_filter = ("target_domain", "gender", "location", "experience_years", "date_of_birth", "created_at")
    search_fields = ("user__email", "user__full_name", "target_domain", "location", "education", "skills")
    readonly_fields = ("candidate_id", "created_at", "updated_at")
    raw_id_fields = ("user",)

    # ---------- EDIT FORM ----------
    # Group all fields into logical sections – every field is included.
    fieldsets = (
        ("Personal Information", {
            "fields": ("user", "profile_picture", "date_of_birth", "gender", "location")
        }),
        ("Professional Details", {
            "fields": ("target_domain", "education", "experience_years", "skills")
        }),
        ("Online Presence", {
            "fields": ("linkedin_url", "github_url", "portfolio_url")
        }),
        ("System Information", {
            "fields": ("candidate_id", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )

    # ---------- CUSTOM METHODS FOR DISPLAY ----------
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"
    user_email.admin_order_field = "user__email"

    def profile_picture_preview(self, obj):
        if obj.profile_picture:
            return format_html(
                '<img src="{}" width="50" height="50" style="border-radius:50%; object-fit:cover;" />',
                obj.profile_picture.url
            )
        return "No photo"
    profile_picture_preview.short_description = "Photo"

    def skills_preview(self, obj):
        if obj.skills:
            # Show first 50 chars of skills
            return obj.skills[:50] + ("…" if len(obj.skills) > 50 else "")
        return "—"
    skills_preview.short_description = "Skills (preview)"