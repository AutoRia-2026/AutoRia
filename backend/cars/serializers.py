from rest_framework import serializers

from .models import Car, CarImage


class CarImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarImage
        fields = ['id', 'image_url', 'position', 'created_at']
        read_only_fields = ['id', 'created_at']


class CarSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.id')
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    images = CarImageSerializer(many=True, required=False)

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
            'images',
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

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        car = Car.objects.create(**validated_data)
        self._save_images(car, images_data)
        return car

    def update(self, instance, validated_data):
        images_data = validated_data.pop('images', None)
        car = super().update(instance, validated_data)

        if images_data is not None:
            car.images.all().delete()
            self._save_images(car, images_data)

        return car

    def _save_images(self, car, images_data):
        for index, image_data in enumerate(images_data):
            position = image_data.get('position', index)
            CarImage.objects.create(
                car=car,
                image_url=image_data['image_url'],
                position=position,
            )
