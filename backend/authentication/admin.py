from django.contrib import admin
from .models import User, OtpVerification

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "role", "is_active", "is_staff")
    search_fields = ("email", "full_name")
    list_filter = ("role", "is_active", "is_staff")


@admin.register(OtpVerification)
class OtpVerificationAdmin(admin.ModelAdmin):
    list_display = ("user", "purpose", "is_verified", "created_at", "expires_at")
    list_filter = ("purpose", "is_verified")
    search_fields = ("user__email",)
    readonly_fields = ("created_at",)