from notifications.utils import create_notification
from notifications.models import Notification
import logging
from django.utils import timezone
from django.core.cache import cache
from .models import User, OtpVerification

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import permission_classes
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)

from .serializers import RegisterSerializer
from .serializers import LoginSerializer
from .serializers import LogoutSerializer
from .serializers import ForgotPasswordSerializer
from .serializers import VerifyOTPSerializer
from .serializers import ResetPasswordSerializer
from .serializers import ProfileSerializer

from datetime import timedelta
from .utils import generate_otp, send_otp_email


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    verified = cache.get(f"reg_verified_{data['email']}")

    if not verified:
        return Response(
            {"message": "Please verify your email first."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User(
        full_name=data["full_name"],
        email=data["email"],
        role=data["role"],
        is_active=True,
        is_email_verified=True,
    )

    user.set_password(data["password"])
    user.save()
    create_notification(
        user=user,
        notification_type="system",
        title="Welcome to PrepMaster",
        message="Your account has been created successfully. Welcome aboard!",
    )

    return Response(
        {"message": "Registration successful."}, status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        logger.warning("Login validation failed: %s", serializer.errors)

        errors = serializer.errors

        if "message" in errors:
            return Response(
                {
                    "message": (
                        errors["message"][0]
                        if isinstance(errors["message"], list)
                        else errors["message"]
                    )
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {"message": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        refresh["user_id"] = user.user_id
        refresh["email"] = user.email
        refresh["role"] = user.role

        response_data = {
            "message": "Login successful.",
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
            "user": {
                "user_id": user.user_id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
            },
        }

        # Create login notification after building response (non-blocking for user)
        try:
            create_notification(
                user=user,
                notification_type="system",
                title="Login Successful",
                message="Welcome back to PrepMaster.",
            )
        except Exception:
            pass

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception:
        logger.exception("Unexpected login failure")
        return Response(
            {"message": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )


@api_view(["POST"])
def logout(request):
    serializer = LogoutSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    refresh_token = request.data.get("refresh_token")
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass

    return Response({"message": "Logout successful."}, status=200)


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]

    try:
        user = User.objects.get(email=email)

    except User.DoesNotExist:
        return Response(
            {"message": "User with this email does not exist."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Delete old OTPs
    OtpVerification.objects.filter(user=user, purpose="password_reset").delete()

    # Generate new OTP
    otp = generate_otp()

    # Save OTP
    OtpVerification.objects.create(
        user=user,
        otp_code=otp,
        purpose="password_reset",
        is_verified=False,
        attempts=0,
        expires_at=timezone.now() + timedelta(minutes=10),
    )

    try:
        send_otp_email(user.email, otp, "Forgot Password")

        return Response(
            {"message": "OTP sent successfully."}, status=status.HTTP_200_OK
        )

    except Exception as e:
        print("EMAIL ERROR:", str(e))
        logger.exception(e)

    return Response(
        {"message": str(e)},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )

    return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    serializer = VerifyOTPSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    otp = serializer.validated_data["otp"]

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"message": "Email not registered."}, status=status.HTTP_404_NOT_FOUND
        )

    otp_record = (
        OtpVerification.objects.filter(
            user=user, purpose="password_reset", is_verified=False
        )
        .order_by("-created_at")
        .first()
    )

    if otp_record is None:
        return Response({"message": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

    if otp_record.expires_at < timezone.now():
        otp_record.delete()
        return Response(
            {"message": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST
        )

    if otp_record.attempts >= 5:
        return Response(
            {"message": "Too many invalid attempts."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if otp_record.otp_code != otp:
        otp_record.attempts += 1
        otp_record.save(update_fields=["attempts"])

        return Response({"message": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

    otp_record.is_verified = True
    otp_record.save()

    return Response(
        {"message": "OTP verified successfully."}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    new_password = serializer.validated_data["new_password"]

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"message": "User not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    otp_record = (
        OtpVerification.objects.filter(
            user=user,
            purpose="password_reset",
            is_verified=True,
        )
        .order_by("-created_at")
        .first()
    )

    if otp_record is None:
        return Response(
            {"message": "OTP verification required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.set_password(new_password)
    user.save()

    otp_record.is_verified = False
    otp_record.save(update_fields=["is_verified"])
    otp_record.delete()

    return Response(
        {"message": "Password reset successful."},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def send_registration_otp(request):
    email = request.data.get("email")
    if not email:
        return Response({"message": "Email is required."}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({"message": "Email already registered."}, status=400)

    otp = generate_otp()
    cache.set(
        f"reg_otp_{email}",
        {"otp": otp, "expires": timezone.now() + timedelta(minutes=10)},
        timeout=600,
    )

    try:
        send_otp_email(email, otp, "Registration")
        return Response({"message": "OTP sent to your email."}, status=200)
    except Exception as e:
        logger.exception("Failed to send registration OTP")
        return Response(
            {"message": "Failed to send OTP. Please try again."}, status=500
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_registration_otp(request):
    email = request.data.get("email")
    otp = request.data.get("otp")
    if not email or not otp:
        return Response({"message": "Email and OTP are required."}, status=400)
    if not otp.isdigit() or len(otp) != 6:
        return Response({"message": "Invalid OTP format."}, status=400)

    cached = cache.get(f"reg_otp_{email}")
    if not cached:
        return Response({"message": "OTP expired or not found."}, status=400)
    if cached["otp"] != otp:
        return Response({"message": "Invalid OTP."}, status=400)
    if cached["expires"] < timezone.now():
        cache.delete(f"reg_otp_{email}")
        return Response({"message": "OTP expired."}, status=400)

    cache.set(f"reg_verified_{email}", True, timeout=300)
    cache.delete(f"reg_otp_{email}")
    return Response(
        {"message": "OTP verified successfully.", "verified_email": email}, status=200
    )





@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    from .services import get_auth_profile_data
    data = get_auth_profile_data(request.user)
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_usage(request):
    """
    Returns user credit & usage data using service layer.
    """
    from .services import get_user_usage_summary

    data = get_user_usage_summary(request.user)
    return Response(data, status=status.HTTP_200_OK)
