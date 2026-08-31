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
    transmission = models.CharField(max_length=20, choices=TRANSMISSION_CHOICES)
    fuel_type = models.CharField(max_length=20, choices=FUEL_CHOICES)
    image_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
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
    image_url = models.URLField()
    position = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position', 'id']
        constraints = [
            models.UniqueConstraint(fields=['car', 'position'], name='unique_car_image_position'),
        ]

    def __str__(self):
        return f'{self.car_id} image {self.position}'


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
