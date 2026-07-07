from rest_framework import serializers

from .models import Car


class CarSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.id')

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
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
