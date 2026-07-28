from django.db import models
from .managers import UserManager
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    Group,
    Permission,
)

class User(AbstractBaseUser, PermissionsMixin):
    user_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    role = models.CharField(max_length=20, default='candidate')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    has_premium = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        Group,
        blank=True,
        related_name="authentication_users",
    )

    user_permissions = models.ManyToManyField(
        Permission,
        blank=True,
        related_name="authentication_users",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    class Meta:
        db_table = "Users"

    def __str__(self):
        return self.email

    @property
    def id(self):
        return self.user_id


class OtpVerification(models.Model):
    otp_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id")
    otp_code = models.CharField(max_length=10)
    PURPOSE_CHOICES = [
        ("registration", "Registration"),
        ("login", "Login"),
        ("password_reset", "Password Reset"),
        ("email_verification", "Email Verification"),
    ]

    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    is_verified = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "OTP_Verification"
        indexes = [
            models.Index(fields=["user", "purpose", "is_verified"]),
        ]


class UserCredit(models.Model):
    credit_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="credits", db_column="user_id")

    quiz_used = models.IntegerField(default=0)
    quiz_limit = models.IntegerField(default=20)
    quiz_last_reset = models.DateField(null=True, blank=True)

    coding_used = models.IntegerField(default=0)
    coding_limit = models.IntegerField(default=20)
    coding_last_reset = models.DateField(null=True, blank=True)

    resume_used = models.IntegerField(default=0)
    resume_limit = models.IntegerField(default=5)
    resume_last_reset = models.DateField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "User_Credits"

    def check_and_reset(self, today=None):
        from django.utils import timezone
        if today is None:
            today = timezone.now().date()

        current_month_start = today.replace(day=1)
        updated = False

        if self.quiz_last_reset != today:
            self.quiz_used = 0
            self.quiz_last_reset = today
            updated = True

        if self.coding_last_reset != today:
            self.coding_used = 0
            self.coding_last_reset = today
            updated = True

        if self.resume_last_reset is None or self.resume_last_reset < current_month_start:
            self.resume_used = 0
            self.resume_last_reset = current_month_start
            updated = True

        if updated and self.pk:
            self.save(update_fields=["quiz_used", "quiz_last_reset", "coding_used", "coding_last_reset", "resume_used", "resume_last_reset", "updated_at"])

    def __str__(self):
        return f"{self.user.email}'s Credits"
