from datetime import timedelta
import json
import random
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from django.contrib.auth import get_user_model, login, logout
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EmailVerificationCode, SellerProfile
from .serializers import (
    EmailCodeSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    SocialAuthSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
)


User = get_user_model()


def auth_response(user):
    token, created = Token.objects.get_or_create(user=user)
    return {
        'token': token.key,
        'user': UserSerializer(user).data,
    }


def create_email_code(user, purpose):
    EmailVerificationCode.objects.filter(
        user=user,
        purpose=purpose,
        is_used=False,
    ).update(is_used=True)

    code = f'{random.randint(100000, 999999)}'
    verification = EmailVerificationCode.objects.create(
        user=user,
        code=code,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=15),
    )

    return verification


def send_code_email(user, verification):
    subject = 'Your VEYO verification code'
    message = f'Your verification code is: {verification.code}'
    send_mail(subject, message, None, [user.email], fail_silently=False)


def fetch_social_json(url):
    try:
        with urlopen(url, timeout=7) as response:
            return json.loads(response.read().decode('utf-8'))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise ValueError('Invalid social access token.') from exc


def verify_google_access_token(access_token):
    if not settings.GOOGLE_OAUTH_CLIENT_ID:
        raise RuntimeError('Google OAuth is not configured.')

    params = urlencode({'access_token': access_token})
    profile = fetch_social_json(f'https://oauth2.googleapis.com/tokeninfo?{params}')

    if profile.get('aud') != settings.GOOGLE_OAUTH_CLIENT_ID:
        raise ValueError('Invalid Google OAuth audience.')

    email = profile.get('email', '').lower()
    email_verified = profile.get('email_verified')
    if not email or email_verified not in (True, 'true', 'True', '1', 1):
        raise ValueError('Google account email is not verified.')

    return {
        'email': email,
        'name': profile.get('name') or email.split('@')[0],
    }


def verify_facebook_access_token(access_token):
    if not settings.FACEBOOK_APP_ID or not settings.FACEBOOK_APP_SECRET:
        raise RuntimeError('Facebook OAuth is not configured.')

    app_token = f'{settings.FACEBOOK_APP_ID}|{settings.FACEBOOK_APP_SECRET}'
    debug_params = urlencode({'input_token': access_token, 'access_token': app_token})
    debug_data = fetch_social_json(f'https://graph.facebook.com/debug_token?{debug_params}')
    token_data = debug_data.get('data', {})

    if not token_data.get('is_valid') or str(token_data.get('app_id')) != str(settings.FACEBOOK_APP_ID):
        raise ValueError('Invalid Facebook access token.')

    profile_params = urlencode({'fields': 'id,name,email', 'access_token': access_token})
    profile = fetch_social_json(f'https://graph.facebook.com/me?{profile_params}')
    email = profile.get('email', '').lower()
    if not email:
        raise ValueError('Facebook account email is required.')

    return {
        'email': email,
        'name': profile.get('name') or email.split('@')[0],
    }


def unique_username_for_email(email):
    base = email.split('@')[0].replace('.', '_').replace('-', '_') or 'user'
    username = base
    index = 1

    while User.objects.filter(username__iexact=username).exists():
        index += 1
        username = f'{base}_{index}'

    return username


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        verification = create_email_code(user, EmailVerificationCode.PURPOSE_REGISTER)
        send_code_email(user, verification)
        return Response(
            {'detail': 'Verification code has been sent to your email.'},
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailView(APIView):
    def post(self, request):
        serializer = EmailCodeSerializer(
            data=request.data,
            context={'purpose': EmailVerificationCode.PURPOSE_REGISTER},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        verification = serializer.validated_data['verification']
        user.is_active = True
        user.save(update_fields=['is_active'])
        verification.is_used = True
        verification.save(update_fields=['is_used'])

        return Response({'detail': 'Email verified successfully.'})


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        return Response(auth_response(user))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)


class ForgotPasswordView(APIView):
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verification = create_email_code(
            serializer.user,
            EmailVerificationCode.PURPOSE_PASSWORD_RESET,
        )
        send_code_email(serializer.user, verification)
        return Response({'detail': 'Password reset code has been sent to your email.'})


class ResetPasswordView(APIView):
    def post(self, request):
        serializer = ResetPasswordSerializer(
            data=request.data,
            context={'purpose': EmailVerificationCode.PURPOSE_PASSWORD_RESET},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        verification = serializer.validated_data['verification']
        user.set_password(serializer.validated_data['password'])
        user.save()
        verification.is_used = True
        verification.save(update_fields=['is_used'])

        return Response({'detail': 'Password has been reset successfully.'})


class SocialAuthView(APIView):
    def post(self, request):
        serializer = SocialAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        provider = serializer.validated_data['provider']
        access_token = serializer.validated_data['access_token']

        try:
            if provider == 'google':
                profile = verify_google_access_token(access_token)
            else:
                profile = verify_facebook_access_token(access_token)
        except RuntimeError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        email = profile['email']
        name = profile.get('name', '')

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': unique_username_for_email(email),
                'first_name': name,
                'is_active': True,
            },
        )

        if created:
            user.set_unusable_password()
            user.save()
        elif not user.is_active:
            user.is_active = True
            user.save(update_fields=['is_active'])

        SellerProfile.objects.get_or_create(user=user)

        login(request, user)
        return Response(auth_response(user))
