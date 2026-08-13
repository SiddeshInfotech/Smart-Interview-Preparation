from django.test import TestCase
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from .models import User


class RegistrationOTPTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.email = "testuser@example.com"
        cache.clear()

    def test_send_registration_otp_success(self):
        response = self.client.post("/api/auth/send-registration-otp/", {"email": self.email}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("OTP sent to your email.", response.data.get("message"))
        cached = cache.get(f"reg_otp_{self.email}")
        self.assertIsNotNone(cached)
        self.assertIn("otp", cached)

    def test_verify_registration_otp_success(self):
        self.client.post("/api/auth/send-registration-otp/", {"email": self.email}, format="json")
        cached = cache.get(f"reg_otp_{self.email}")
        otp_code = cached["otp"]

        verify_res = self.client.post(
            "/api/auth/verify-registration-otp/",
            {"email": self.email, "otp": otp_code},
            format="json",
        )
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_res.data.get("message"), "OTP verified successfully.")

        verified = cache.get(f"reg_verified_{self.email}")
        self.assertTrue(verified)

    def test_verify_registration_otp_invalid_code(self):
        self.client.post("/api/auth/send-registration-otp/", {"email": self.email}, format="json")

        verify_res = self.client.post(
            "/api/auth/verify-registration-otp/",
            {"email": self.email, "otp": "000000"},
            format="json",
        )
        self.assertEqual(verify_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(verify_res.data.get("message"), "Invalid OTP.")

    def test_verify_registration_otp_expired(self):
        otp_data = {
            "otp": "123456",
            "expires": timezone.now() - timedelta(minutes=1),
            "attempts": 0,
        }
        cache.set(f"reg_otp_{self.email}", otp_data, timeout=600)

        verify_res = self.client.post(
            "/api/auth/verify-registration-otp/",
            {"email": self.email, "otp": "123456"},
            format="json",
        )
        self.assertEqual(verify_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(verify_res.data.get("message"), "OTP has expired.")

    def test_verify_registration_otp_missing_fields(self):
        verify_res = self.client.post(
            "/api/auth/verify-registration-otp/",
            {"email": self.email},
            format="json",
        )
        self.assertEqual(verify_res.status_code, status.HTTP_400_BAD_REQUEST)

