from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token

from .models import EmailVerificationCode, SellerProfile


class AccountVerificationTests(APITestCase):
    def test_register_creates_inactive_user_and_email_code(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'new@example.com',
                'username': 'newuser',
                'first_name': 'New User',
                'password': 'StrongPass123',
                'phone': '+380501112233',
                'city': 'Kyiv',
            },
            format='json',
        )

        user = get_user_model().objects.get(email='new@example.com')

        self.assertEqual(response.status_code, 201)
        self.assertFalse(user.is_active)
        self.assertTrue(
            SellerProfile.objects.filter(
                user=user,
                phone='+380501112233',
                city='Kyiv',
            ).exists()
        )
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

    def test_user_can_update_profile(self):
        user = get_user_model().objects.create_user(
            username='profileuser',
            email='profile@example.com',
            password='StrongPass123',
        )
        token = Token.objects.create(user=user)

        response = self.client.patch(
            '/api/auth/me/',
            {
                'first_name': 'Ivan',
                'last_name': 'Seller',
                'phone': '+380671112233',
                'city': 'Lviv',
            },
            HTTP_AUTHORIZATION=f'Token {token.key}',
            format='json',
        )

        user.refresh_from_db()
        profile = SellerProfile.objects.get(user=user)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(user.first_name, 'Ivan')
        self.assertEqual(user.last_name, 'Seller')
        self.assertEqual(profile.phone, '+380671112233')
        self.assertEqual(profile.city, 'Lviv')

    def test_social_auth_requires_access_token(self):
        response = self.client.post(
            '/api/auth/social/',
            {'provider': 'google'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('access_token', response.data)

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='')
    def test_social_auth_requires_provider_configuration(self):
        response = self.client.post(
            '/api/auth/social/',
            {'provider': 'google', 'access_token': 'token'},
            format='json',
        )

        self.assertEqual(response.status_code, 503)

    @override_settings(GOOGLE_OAUTH_CLIENT_ID='google-client-id')
    @patch('accounts.views.verify_google_access_token')
    def test_social_auth_creates_active_user_from_verified_token(self, verify_google_access_token):
        verify_google_access_token.return_value = {
            'email': 'real.google@example.com',
            'name': 'Real Google User',
        }

        response = self.client.post(
            '/api/auth/social/',
            {'provider': 'google', 'access_token': 'verified-token'},
            format='json',
        )

        user = get_user_model().objects.get(email='real.google@example.com')

        verify_google_access_token.assert_called_once_with('verified-token')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(user.is_active)
        self.assertTrue(user.has_usable_password() is False)
        self.assertIn('token', response.data)
        self.assertTrue(SellerProfile.objects.filter(user=user).exists())
