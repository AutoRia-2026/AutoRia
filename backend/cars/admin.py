from django.contrib import admin

from .models import Car, CarImage, CarLike


class CarImageInline(admin.TabularInline):
    model = CarImage
    extra = 1


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'brand',
        'model',
        'year',
        'price',
        'fuel_type',
        'owner',
        'views_count',
        'created_at',
    ]
    list_filter = ['brand', 'fuel_type', 'transmission', 'year']
    search_fields = ['brand', 'model', 'description', 'owner__username', 'owner__email']
    inlines = [CarImageInline]


@admin.register(CarImage)
class CarImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'car', 'position', 'image_url', 'created_at']
    list_filter = ['car__brand']
    search_fields = ['car__brand', 'car__model', 'image_url']


@admin.register(CarLike)
class CarLikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'car', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'car__brand', 'car__model']
