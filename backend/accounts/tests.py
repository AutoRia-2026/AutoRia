from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase

from .models import EmailVerificationCode


class AccountVerificationTests(APITestCase):
    def test_register_creates_inactive_user_and_email_code(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'new@example.com',
                'username': 'newuser',
                'first_name': 'New User',
                'password': 'StrongPass123',
            },
            format='json',
        )

        user = get_user_model().objects.get(email='new@example.com')

        self.assertEqual(response.status_code, 201)
        self.assertFalse(user.is_active)
        self.assertTrue(
            EmailVerificationCode.objects.filter(
                user=user,
                purpose=EmailVerificationCode.PURPOSE_REGISTER,
                is_used=False,
            ).exists()
        )

    def test_verify_email_activates_user(self):
        user = get_user_model().objects.create_user(
            username='verifyuser',
            email='verify@example.com',
            password='StrongPass123',
            is_active=False,
        )
        verification = EmailVerificationCode.objects.create(
            user=user,
            code='123456',
            purpose=EmailVerificationCode.PURPOSE_REGISTER,
            expires_at=timezone.now() + timedelta(minutes=15),
        )

        response = self.client.post(
            '/api/auth/verify-email/',
            {'email': user.email, 'code': verification.code},
            format='json',
        )

        user.refresh_from_db()
        verification.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(user.is_active)
        self.assertTrue(verification.is_used)

    def test_reset_password_changes_user_password(self):
        user = get_user_model().objects.create_user(
            username='resetuser',
            email='reset@example.com',
            password='OldStrongPass123',
        )
        verification = EmailVerificationCode.objects.create(
            user=user,
            code='654321',
            purpose=EmailVerificationCode.PURPOSE_PASSWORD_RESET,
            expires_at=timezone.now() + timedelta(minutes=15),
        )

        response = self.client.post(
            '/api/auth/reset-password/',
            {
                'email': user.email,
                'code': verification.code,
                'password': 'NewStrongPass123',
            },
            format='json',
        )

        user.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(user.check_password('NewStrongPass123'))
