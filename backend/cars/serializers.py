from rest_framework import serializers

from .models import Car, CarComment, CarImage


class CarImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarImage
        fields = ['id', 'image_url', 'position', 'created_at']
        read_only_fields = ['id', 'created_at']


class CarCommentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.id')
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = CarComment
        fields = ['id', 'user', 'username', 'text', 'created_at']
        read_only_fields = ['id', 'user', 'username', 'created_at']


class CarSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.id')
    seller = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    images = CarImageSerializer(many=True, required=False)
    comments = CarCommentSerializer(many=True, read_only=True)

    class Meta:
        model = Car
        fields = [
            'id',
            'owner',
            'seller',
            'brand',
            'model',
            'year',
            'mileage',
            'price',
            'transmission',
            'fuel_type',
            'image_url',
            'description',
            'status',
            'views_count',
            'likes_count',
            'images',
            'comments',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'owner',
            'seller',
            'views_count',
            'likes_count',
            'comments',
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

    def get_seller(self, car):
        if car.owner is None:
            return None

        profile = getattr(car.owner, 'seller_profile', None)

        return {
            'id': car.owner.id,
            'username': car.owner.username,
            'email': car.owner.email,
            'first_name': car.owner.first_name,
            'last_name': car.owner.last_name,
            'phone': profile.phone if profile else '',
            'city': profile.city if profile else '',
        }
