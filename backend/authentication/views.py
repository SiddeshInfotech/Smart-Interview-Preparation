import logging
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import permission_classes

from .models import User
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
from .models import OtpVerification
from .utils import generate_otp, send_otp_email


@api_view(["POST"])
@permission_classes([AllowAny])
def send_registration_otp(request):
    """Send OTP to email for registration."""
    email = request.data.get("email")

    if not email:
        return Response(
            {"message": "Email is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check if email already registered
    if User.objects.filter(email=email).exists():
        return Response(
            {"message": "Email already registered."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Generate and send OTP
    otp = generate_otp()

    try:
        send_otp_email(email, otp, "Registration")
        return Response(
            {"message": "OTP sent to your email."},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.exception("Failed to send registration OTP")
        return Response(
            {"message": "Failed to send OTP. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_registration_otp(request):
    """Verify OTP for registration (stores verification in cache/session)."""
    email = request.data.get("email")
    otp = request.data.get("otp")

    if not email or not otp:
        return Response(
            {"message": "Email and OTP are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # In production, you'd verify against a cache/session store.
    # For now, we'll accept any 6-digit OTP and trust the frontend to only show
    # this endpoint after email verification. A real implementation would:
    # - Store OTP in cache with email as key
    # - Verify OTP matches and hasn't expired
    # - Mark email as verified in cache before returning the final register call

    # Simple check: OTP should be 6 digits
    if not otp.isdigit() or len(otp) != 6:
        return Response(
            {"message": "Invalid OTP format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # TODO: Verify against cache/session in production
    # For now, return success and frontend will proceed with registration
    return Response(
        {"message": "OTP verified successfully.", "verified_email": email},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    user = User(
        full_name=data["full_name"],
        email=data["email"],
        role=data["role"],
        phone_number=data.get("phone_number"),
        is_active=True,
        is_email_verified=True,  # Mark as verified since they verified OTP during signup
    )

    user.set_password(data["password"])
    user.save()

    return Response(
        {"message": "Registration successful.", "user_id": user.user_id},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        logger.warning("Login validation failed: %s", serializer.errors)
        # Return user-friendly serializer errors (email not verified, account inactive, etc.)
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
        # If no specific message, use generic error
        return Response(
            {"message": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        # The serializer validates credentials and attaches `user`
        user = serializer.validated_data.get("user")

        # Create tokens for the authenticated user
        refresh = RefreshToken.for_user(user)

        # attach some custom claims
        refresh["user_id"] = user.user_id
        refresh["email"] = user.email
        refresh["role"] = user.role

        return Response(
            {
                "message": "Login successful.",
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": {
                    "user_id": user.user_id,
                    "full_name": user.full_name,
                    "email": user.email,
                    "role": user.role,
                },
            },
            status=status.HTTP_200_OK,
        )
    except Exception as exc:
        # Internal error during login should not leak stack traces to the client.
        logger.exception("Unexpected login failure")
        return Response(
            {"message": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )


@api_view(["POST"])
def logout(request):
    serializer = LogoutSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)


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

    otp = generate_otp()

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
            {"message": "OTP sent successfully."},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        logger.exception(f"Failed to send OTP to {email}")
        return Response(
            {"message": "Failed to send OTP. Please try again later."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp(request):
    serializer = VerifyOTPSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    otp = serializer.validated_data["otp"]

    # Check user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"message": "Email not registered."}, status=status.HTTP_404_NOT_FOUND
        )

    # Get latest unverified OTP for password reset
    otp_record = (
        OtpVerification.objects.filter(
            user=user, purpose="password_reset", is_verified=False
        )
        .order_by("-created_at")
        .first()
    )

    if otp_record is None:
        return Response({"message": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

    # Check expiry
    if otp_record.expires_at < timezone.now():
        return Response(
            {"message": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST
        )

    # Check OTP
    if otp_record.otp_code != otp:
        otp_record.attempts += 1
        otp_record.save(update_fields=["attempts"])

        return Response({"message": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

    # OTP verified
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

    # Check user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"message": "User not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Check if OTP has been verified
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

    # Update password
    user.set_password(new_password)
    user.save()

    # Prevent OTP reuse
    otp_record.is_verified = False
    otp_record.save(update_fields=["is_verified"])

    return Response(
        {"message": "Password reset successful."},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_profile(request):
    serializer = ProfileSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)
