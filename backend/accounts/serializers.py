from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

from .models import EmailVerificationCode, SellerProfile


User = get_user_model()


class SellerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = SellerProfile
        fields = ['phone', 'city', 'date_of_birth', 'country', 'street_address', 'state_province']


class UserSerializer(serializers.ModelSerializer):
    seller_profile = SellerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'seller_profile']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False, allow_blank=True, write_only=True)
    city = serializers.CharField(required=False, allow_blank=True, write_only=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True, write_only=True)
    country = serializers.CharField(required=False, allow_blank=True, write_only=True)
    street_address = serializers.CharField(required=False, allow_blank=True, write_only=True)
    state_province = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'first_name',
            'last_name',
            'phone',
            'city',
            'date_of_birth',
            'country',
            'street_address',
            'state_province',
        ]

    def validate_username(self, value):
        if User.objects.exclude(pk=self.instance.pk).filter(username__iexact=value).exists():
            raise serializers.ValidationError('User with this username already exists.')
        return value

    def validate_email(self, value):
        if User.objects.exclude(pk=self.instance.pk).filter(email__iexact=value).exists():
            raise serializers.ValidationError('User with this email already exists.')
        return value.lower()

    def update(self, instance, validated_data):
        phone = validated_data.pop('phone', None)
        city = validated_data.pop('city', None)
        date_of_birth = validated_data.pop('date_of_birth', None)
        country = validated_data.pop('country', None)
        street_address = validated_data.pop('street_address', None)
        state_province = validated_data.pop('state_province', None)

        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        profile, _ = SellerProfile.objects.get_or_create(user=instance)
        if phone is not None:
            profile.phone = phone
        if city is not None:
            profile.city = city
        if date_of_birth is not None:
            profile.date_of_birth = date_of_birth
        if country is not None:
            profile.country = country
        if street_address is not None:
            profile.street_address = street_address
        if state_province is not None:
            profile.state_province = state_province
        profile.save()

        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(required=False, allow_blank=True, write_only=True)
    city = serializers.CharField(required=False, allow_blank=True, write_only=True)
    country = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'password', 'phone', 'city', 'country']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('User with this email already exists.')
        return value

    def create(self, validated_data):
        phone = validated_data.pop('phone', '')
        city = validated_data.pop('city', '')
        country = validated_data.pop('country', '')
        email = validated_data['email'].lower()
        username = validated_data.get('username') or email
        user = User(
            email=email,
            username=username,
            first_name=validated_data.get('first_name', ''),
            is_active=False,
        )
        user.set_password(validated_data['password'])
        user.save()
        SellerProfile.objects.create(user=user, phone=phone, city=city, country=country)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs['email'].lower()
        password = attrs['password']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError('Invalid email or password.') from exc

        user = authenticate(
            request=self.context.get('request'),
            username=user.username,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError('Invalid email or password.')

        attrs['user'] = user
        return attrs


class EmailCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        email = attrs['email'].lower()
        code = attrs['code']
        purpose = self.context['purpose']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError('Invalid verification code.') from exc

        verification = (
            EmailVerificationCode.objects.filter(
                user=user,
                code=code,
                purpose=purpose,
                is_used=False,
            )
            .order_by('-created_at')
            .first()
        )

        if verification is None or verification.is_expired():
            raise serializers.ValidationError('Invalid verification code.')

        attrs['user'] = user
        attrs['verification'] = verification
        return attrs


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.get(email__iexact=value.lower())
        except User.DoesNotExist as exc:
            raise serializers.ValidationError('User with this email does not exist.') from exc

        return value.lower()


class ResetPasswordSerializer(EmailCodeSerializer):
    password = serializers.CharField(write_only=True, min_length=8)


class SocialAuthSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=['google', 'facebook'])
    access_token = serializers.CharField(write_only=True)
