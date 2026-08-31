from rest_framework import serializers

from .models import Car


class CarSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.id')
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)

    class Meta:
        model = Car
        fields = [
            'id',
            'owner',
            'brand',
            'model',
            'year',
            'mileage',
            'price',
            'transmission',
            'fuel_type',
            'image_url',
            'description',
            'views_count',
            'likes_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'owner',
            'views_count',
            'likes_count',
            'created_at',
            'updated_at',
        ]
