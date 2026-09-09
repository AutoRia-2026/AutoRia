from django.contrib import admin

from .models import Car, CarComment, CarImage, CarLike, CarReview, Conversation, Message, SavedSearch


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
        'status',
        'is_promoted',
        'owner',
        'views_count',
        'created_at',
    ]
    list_filter = ['status', 'is_promoted', 'brand', 'fuel_type', 'transmission', 'year']
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


@admin.register(CarComment)
class CarCommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'car', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['text', 'user__username', 'user__email', 'car__brand', 'car__model']


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'car', 'buyer', 'seller', 'updated_at', 'created_at']
    list_filter = ['updated_at', 'created_at']
    search_fields = ['car__brand', 'car__model', 'buyer__username', 'seller__username']
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['text', 'sender__username', 'sender__email']


@admin.register(CarReview)
class CarReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'car', 'user', 'rating', 'recommend_seller', 'created_at']
    list_filter = ['rating', 'recommend_seller', 'created_at']
    search_fields = ['text', 'user__username', 'user__email', 'car__brand', 'car__model']


@admin.register(SavedSearch)
class SavedSearchAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'query', 'created_at']
    list_filter = ['created_at']
    search_fields = ['title', 'query', 'user__username', 'user__email']
