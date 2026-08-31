from datetime import timedelta
import random

from django.contrib.auth import login, logout
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EmailVerificationCode
from .serializers import (
    EmailCodeSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
)


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
