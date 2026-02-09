from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """JWT authentication that reads tokens from httpOnly cookies,
    falling back to the Authorization header."""

    def authenticate(self, request):
        # Try header first (for API clients, admin, etc.)
        header_result = super().authenticate(request)
        if header_result is not None:
            return header_result

        # Fall back to cookie
        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
