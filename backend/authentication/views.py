from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

from .models import User
from rest_framework_simplejwt.tokens import RefreshToken

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
    is_email_verified=False,
    )

    user.set_password(data["password"])
    user.save()

    return Response(
        {"message": "Registration successful.", "user_id": user.user_id},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def login(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"message": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.check_password(password):
        return Response(
            {"message": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken()

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


@api_view(["POST"])
def logout(request):
    serializer = LogoutSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)


@api_view(["POST"])
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

    send_otp_email(user.email, otp, "Forgot Password")

    return Response({"message": "OTP sent successfully."}, status=status.HTTP_200_OK)


@api_view(["POST"])
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
