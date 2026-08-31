from django.contrib import admin

from .models import EmailVerificationCode, SellerProfile


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'phone', 'city', 'updated_at']
    search_fields = ['user__username', 'user__email', 'phone', 'city']


@admin.register(EmailVerificationCode)
class EmailVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'purpose', 'code', 'is_used', 'expires_at', 'created_at']
    list_filter = ['purpose', 'is_used', 'created_at']
    search_fields = ['user__username', 'user__email', 'code']
