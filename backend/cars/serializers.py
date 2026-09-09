from rest_framework import serializers

from .models import Car, CarComment, CarImage, CarReview, SavedSearch


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


class CarReviewSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.id')
    username = serializers.ReadOnlyField(source='user.username')
    car_title = serializers.SerializerMethodField()
    car_image_url = serializers.ReadOnlyField(source='car.image_url')

    class Meta:
        model = CarReview
        fields = [
            'id',
            'car',
            'car_title',
            'car_image_url',
            'user',
            'username',
            'rating',
            'text',
            'recommend_seller',
            'created_at',
        ]
        read_only_fields = ['id', 'car', 'car_title', 'car_image_url', 'user', 'username', 'created_at']

    def validate_rating(self, rating):
        if rating < 1 or rating > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')

        return rating

    def get_car_title(self, review):
        return str(review.car)


class SavedSearchSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.id')

    class Meta:
        model = SavedSearch
        fields = ['id', 'user', 'title', 'query', 'filters', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class CarSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.id')
    seller = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    images = CarImageSerializer(many=True, required=False)
    comments = CarCommentSerializer(many=True, read_only=True)
    reviews = CarReviewSerializer(many=True, read_only=True)
    reviews_count = serializers.IntegerField(source='reviews.count', read_only=True)

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
            'is_promoted',
            'promoted_at',
            'views_count',
            'likes_count',
            'images',
            'comments',
            'reviews',
            'reviews_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'owner',
            'seller',
            'is_promoted',
            'promoted_at',
            'views_count',
            'likes_count',
            'comments',
            'reviews',
            'reviews_count',
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
