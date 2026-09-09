from django.db import models
from django.conf import settings


class Car(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_SOLD = 'sold'
    STATUS_HIDDEN = 'hidden'

    TRANSMISSION_CHOICES = [
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
        ('robot', 'Robot'),
        ('variator', 'Variator'),
    ]

    FUEL_CHOICES = [
        ('petrol', 'Petrol'),
        ('diesel', 'Diesel'),
        ('gas', 'Gas'),
        ('hybrid', 'Hybrid'),
        ('electric', 'Electric'),
    ]

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_SOLD, 'Sold'),
        (STATUS_HIDDEN, 'Hidden'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cars',
        null=True,
        blank=True,
    )
    brand = models.CharField(max_length=80)
    model = models.CharField(max_length=80)
    year = models.PositiveSmallIntegerField()
    mileage = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    is_available_for_rent = models.BooleanField(default=True, db_index=True)
    rent_price_per_day = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rent_price_per_week = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rent_deposit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    minimum_rent_days = models.PositiveSmallIntegerField(default=1)
    transmission = models.CharField(max_length=20, choices=TRANSMISSION_CHOICES)
    fuel_type = models.CharField(max_length=20, choices=FUEL_CHOICES)
    body_type = models.CharField(max_length=40, blank=True)
    condition = models.CharField(max_length=40, blank=True)
    color = models.CharField(max_length=40, blank=True)
    image_url = models.TextField(blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    is_promoted = models.BooleanField(default=False)
    promoted_at = models.DateTimeField(null=True, blank=True)
    views_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.brand} {self.model} {self.year}'


class CarLike(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='car_likes',
    )
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='likes',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'car'], name='unique_user_car_like'),
        ]

    def __str__(self):
        return f'{self.user_id} liked {self.car_id}'


class CarImage(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='images',
    )
    image_url = models.TextField()
    position = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position', 'id']
        constraints = [
            models.UniqueConstraint(fields=['car', 'position'], name='unique_car_image_position'),
        ]

    def __str__(self):
        return f'{self.car_id} image {self.position}'


class Conversation(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='conversations',
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='buyer_conversations',
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='seller_conversations',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        constraints = [
            models.UniqueConstraint(fields=['car', 'buyer', 'seller'], name='unique_car_buyer_seller_conversation'),
        ]

    def __str__(self):
        return f'{self.buyer_id} -> {self.seller_id} about {self.car_id}'


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    text = models.TextField(max_length=1000)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender_id}: {self.text[:40]}'


class RentalBooking(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='rental_bookings',
    )
    renter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rental_bookings',
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_rental_bookings',
    )
    start_date = models.DateField()
    end_date = models.DateField()
    pickup_location = models.CharField(max_length=120)
    dropoff_location = models.CharField(max_length=120, blank=True)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.renter_id} booking {self.car_id} from {self.start_date} to {self.end_date}'


class CarComment(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='comments',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='car_comments',
    )
    text = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user_id} comment on {self.car_id}'


class CarReview(models.Model):
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='car_reviews',
    )
    rating = models.PositiveSmallIntegerField()
    text = models.TextField(max_length=1000)
    recommend_seller = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'car'], name='unique_user_car_review'),
        ]

    def __str__(self):
        return f'{self.user_id} review on {self.car_id}'


class SavedSearch(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_searches',
    )
    title = models.CharField(max_length=120)
    query = models.CharField(max_length=255, blank=True)
    filters = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user_id}: {self.title}'
