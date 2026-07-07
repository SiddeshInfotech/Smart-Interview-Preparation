from django.db import models


class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, max_length=150)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=11)
    phone_number = models.CharField(
        unique=True,
        max_length=20,
        blank=True,
        null=True
    )
    is_active = models.BooleanField(default=True)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "Users"

    def __str__(self):
        return self.full_name


class OtpVerification(models.Model):
    otp_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, models.DO_NOTHING)
    otp_code = models.CharField(max_length=10)
    purpose = models.CharField(max_length=18)
    is_verified = models.IntegerField()
    attempts = models.IntegerField()
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "OTP_Verification"