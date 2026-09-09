from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CarViewSet, ConversationViewSet, RentalBookingViewSet


router = DefaultRouter()
router.register('bookings', RentalBookingViewSet, basename='rental-booking')
router.register('conversations', ConversationViewSet, basename='conversation')
router.register('', CarViewSet, basename='car')

urlpatterns = [
    path('', include(router.urls)),
]
