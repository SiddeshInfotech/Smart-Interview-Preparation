from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed

from .models import User


class CustomJWTAuthentication(JWTAuthentication):

    def get_user(self, validated_token):
        try:
            user_id = validated_token["user_id"]
        except KeyError:
            raise AuthenticationFailed("Token contained no user identification.")

        try:
            return User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found.")