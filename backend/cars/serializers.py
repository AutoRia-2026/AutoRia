from rest_framework import serializers
from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone

from .models import Car, CarComment, CarImage, CarReview, Conversation, Message, RentalBooking, SavedSearch


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


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.ReadOnlyField(source='sender.id')
    sender_name = serializers.ReadOnlyField(source='sender.username')

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'text', 'is_read', 'created_at']
        read_only_fields = ['id', 'conversation', 'sender', 'sender_name', 'is_read', 'created_at']

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError('Message cannot be empty.')

        return value.strip()


class ConversationSerializer(serializers.ModelSerializer):
    car_title = serializers.SerializerMethodField()
    car_image_url = serializers.ReadOnlyField(source='car.image_url')
    buyer_name = serializers.ReadOnlyField(source='buyer.username')
    seller_name = serializers.ReadOnlyField(source='seller.username')
    participant_name = serializers.SerializerMethodField()
    latest_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id',
            'car',
            'car_title',
            'car_image_url',
            'buyer',
            'buyer_name',
            'seller',
            'seller_name',
            'participant_name',
            'latest_message',
            'unread_count',
            'messages',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields

    def get_car_title(self, conversation):
        return str(conversation.car)

    def get_participant_name(self, conversation):
        request = self.context.get('request')
        if not request:
            return conversation.seller.username

        participant = conversation.seller if conversation.buyer_id == request.user.id else conversation.buyer
        return participant.get_full_name() or participant.username

    def get_latest_message(self, conversation):
        message = conversation.messages.order_by('-created_at').first()
        if message is None:
            return None

        return MessageSerializer(message).data

    def get_unread_count(self, conversation):
        request = self.context.get('request')
        if not request:
            return 0

        return conversation.messages.exclude(sender=request.user).filter(is_read=False).count()


class RentalBookingSerializer(serializers.ModelSerializer):
    car_title = serializers.SerializerMethodField()
    car_image_url = serializers.ReadOnlyField(source='car.image_url')
    renter_name = serializers.ReadOnlyField(source='renter.username')
    seller_name = serializers.ReadOnlyField(source='seller.username')
    days = serializers.SerializerMethodField()

    class Meta:
        model = RentalBooking
        fields = [
            'id',
            'car',
            'car_title',
            'car_image_url',
            'renter',
            'renter_name',
            'seller',
            'seller_name',
            'start_date',
            'end_date',
            'pickup_location',
            'dropoff_location',
            'days',
            'total_price',
            'deposit',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'car_title',
            'car_image_url',
            'renter',
            'renter_name',
            'seller',
            'seller_name',
            'days',
            'total_price',
            'deposit',
            'status',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

        if start_date and start_date < timezone.localdate():
            raise serializers.ValidationError({'start_date': 'Start date cannot be in the past.'})

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({'end_date': 'End date cannot be before start date.'})

        return attrs

    def get_car_title(self, booking):
        return str(booking.car)

    def get_days(self, booking):
        return (booking.end_date - booking.start_date).days + 1


class CarSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.id')
    seller = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    images = CarImageSerializer(many=True, required=False)
    comments = CarCommentSerializer(many=True, read_only=True)
    reviews = CarReviewSerializer(many=True, read_only=True)
    reviews_count = serializers.IntegerField(source='reviews.count', read_only=True)
    effective_rent_price_per_day = serializers.SerializerMethodField()

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
            'is_available_for_rent',
            'rent_price_per_day',
            'rent_price_per_week',
            'rent_deposit',
            'minimum_rent_days',
            'effective_rent_price_per_day',
            'transmission',
            'fuel_type',
            'body_type',
            'condition',
            'color',
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
            'effective_rent_price_per_day',
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

    def validate(self, attrs):
        minimum_rent_days = attrs.get('minimum_rent_days')
        rent_fields = ['rent_price_per_day', 'rent_price_per_week', 'rent_deposit']

        if minimum_rent_days is not None and minimum_rent_days < 1:
            raise serializers.ValidationError({'minimum_rent_days': 'Minimum rent days must be at least 1.'})

        for field in rent_fields:
            value = attrs.get(field)
            if value is not None and value <= 0:
                raise serializers.ValidationError({field: 'Rental amounts must be greater than 0.'})

        return attrs

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

    def get_effective_rent_price_per_day(self, car):
        if car.rent_price_per_day:
            return str(car.rent_price_per_day)

        estimated_price = (Decimal(car.price) * Decimal('0.004')).quantize(Decimal('1.00'), rounding=ROUND_HALF_UP)
        return str(max(estimated_price, Decimal('35.00')))
