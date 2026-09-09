from decimal import Decimal, ROUND_HALF_UP

from django.db.models import F, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Car, CarComment, CarLike, CarReview, Conversation, Message, RentalBooking, SavedSearch
from .pagination import CarPagination
from .permissions import IsOwnerOrReadOnly
from .serializers import (
    CarCommentSerializer,
    CarReviewSerializer,
    CarSerializer,
    ConversationSerializer,
    MessageSerializer,
    RentalBookingSerializer,
    SavedSearchSerializer,
)


class CarViewSet(viewsets.ModelViewSet):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [IsOwnerOrReadOnly]
    pagination_class = CarPagination

    def get_queryset(self):
        if self.action == 'my':
            queryset = Car.objects.filter(owner=self.request.user)
        else:
            queryset = Car.objects.filter(status=Car.STATUS_ACTIVE)

        return self.apply_query_params(queryset)

    def apply_query_params(self, queryset):
        params = self.request.query_params

        brand = params.get('brand')
        model = params.get('model')
        fuel_type = params.get('fuel_type')
        price_min = params.get('price_min')
        price_max = params.get('price_max')
        year_min = params.get('year_min')
        year_max = params.get('year_max')
        mileage_min = params.get('mileage_min')
        mileage_max = params.get('mileage_max')
        rental = params.get('rental')
        color = params.get('color')
        body_type = params.get('body_type')
        search = params.get('search')
        ordering = params.get('ordering')
        car_status = params.get('status')

        if brand:
            queryset = queryset.filter(brand__iexact=brand)

        if model:
            queryset = queryset.filter(model__icontains=model)

        if fuel_type:
            queryset = queryset.filter(fuel_type=fuel_type)

        if price_min:
            queryset = queryset.filter(price__gte=price_min)

        if price_max:
            queryset = queryset.filter(price__lte=price_max)

        if year_min:
            queryset = queryset.filter(year__gte=year_min)

        if year_max:
            queryset = queryset.filter(year__lte=year_max)

        if mileage_min:
            queryset = queryset.filter(mileage__gte=mileage_min)

        if mileage_max:
            queryset = queryset.filter(mileage__lte=mileage_max)

        if rental in {'true', '1', 'yes'}:
            queryset = queryset.filter(is_available_for_rent=True)

        if color:
            queryset = queryset.filter(color__iexact=color)

        if body_type:
            queryset = queryset.filter(body_type__iexact=body_type)

        if car_status in {Car.STATUS_ACTIVE, Car.STATUS_SOLD, Car.STATUS_HIDDEN}:
            queryset = queryset.filter(status=car_status)

        if search:
            for term in search.split():
                query = (
                    Q(brand__icontains=term)
                    | Q(model__icontains=term)
                    | Q(description__icontains=term)
                    | Q(body_type__icontains=term)
                    | Q(condition__icontains=term)
                    | Q(color__icontains=term)
                )

                if term.isdigit():
                    query |= Q(year=int(term))

                queryset = queryset.filter(query)

        allowed_ordering = {
            'price',
            '-price',
            'year',
            '-year',
            'mileage',
            '-mileage',
            'created_at',
            '-created_at',
        }

        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated],
        url_path='my',
    )
    def my(self, request):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=['get', 'post'],
        permission_classes=[IsAuthenticated],
        url_path='saved-searches',
    )
    def saved_searches(self, request):
        if request.method == 'GET':
            serializer = SavedSearchSerializer(request.user.saved_searches.all(), many=True)
            return Response(serializer.data)

        serializer = SavedSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved_search = SavedSearch.objects.create(
            user=request.user,
            title=serializer.validated_data['title'],
            query=serializer.validated_data.get('query', ''),
            filters=serializer.validated_data.get('filters', {}),
        )
        return Response(SavedSearchSerializer(saved_search).data, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAuthenticated],
        url_path='favorites',
    )
    def favorites(self, request):
        queryset = Car.objects.filter(
            likes__user=request.user,
            status=Car.STATUS_ACTIVE,
        ).distinct()
        queryset = self.apply_query_params(queryset)
        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Car.objects.filter(pk=instance.pk).update(views_count=F('views_count') + 1)
        instance.refresh_from_db(fields=['views_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=['post', 'delete'],
        permission_classes=[IsAuthenticated],
        url_path='like',
    )
    def like(self, request, pk=None):
        car = self.get_object()

        if request.method == 'POST':
            like, created = CarLike.objects.get_or_create(user=request.user, car=car)

            if not created:
                return Response(
                    {'detail': 'You already liked this car.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {'liked': True, 'likes_count': car.likes.count()},
                status=status.HTTP_201_CREATED,
            )

        deleted_count, _ = CarLike.objects.filter(user=request.user, car=car).delete()

        if deleted_count == 0:
            return Response(
                {'detail': 'You have not liked this car yet.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {'liked': False, 'likes_count': car.likes.count()},
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated],
        url_path='promote',
    )
    def promote(self, request, pk=None):
        car = self.get_object()

        if car.owner_id != request.user.id:
            return Response(
                {'detail': 'You can promote only your own listing.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        car.is_promoted = True
        car.promoted_at = timezone.now()
        car.save(update_fields=['is_promoted', 'promoted_at', 'updated_at'])
        return Response(self.get_serializer(car).data)

    @action(
        detail=True,
        methods=['get', 'post'],
        permission_classes=[IsAuthenticated],
        url_path='comments',
    )
    def comments(self, request, pk=None):
        car = self.get_object()

        if request.method == 'GET':
            serializer = CarCommentSerializer(car.comments.all(), many=True)
            return Response(serializer.data)

        serializer = CarCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = CarComment.objects.create(
            car=car,
            user=request.user,
            text=serializer.validated_data['text'],
        )
        return Response(CarCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[AllowAny],
        url_path='reviews',
    )
    def all_reviews(self, request):
        reviews = CarReview.objects.select_related('car', 'user').filter(car__status=Car.STATUS_ACTIVE)
        serializer = CarReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=['get', 'post'],
        permission_classes=[IsAuthenticated],
        url_path='reviews',
    )
    def reviews(self, request, pk=None):
        car = self.get_object()

        if request.method == 'GET':
            serializer = CarReviewSerializer(car.reviews.select_related('user'), many=True)
            return Response(serializer.data)

        serializer = CarReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review, created = CarReview.objects.get_or_create(
            car=car,
            user=request.user,
            defaults={
                'rating': serializer.validated_data['rating'],
                'text': serializer.validated_data['text'],
                'recommend_seller': serializer.validated_data.get('recommend_seller', True),
            },
        )

        if not created:
            return Response(
                {'detail': 'You already reviewed this car.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(CarReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects.select_related('car', 'buyer', 'seller')
            .prefetch_related('messages', 'messages__sender')
            .filter(Q(buyer=self.request.user) | Q(seller=self.request.user))
        )

    def create(self, request):
        car_id = request.data.get('car')
        text = request.data.get('text', '').strip()

        try:
            car = Car.objects.select_related('owner').get(pk=car_id, status=Car.STATUS_ACTIVE)
        except Car.DoesNotExist:
            return Response({'detail': 'Car was not found.'}, status=status.HTTP_404_NOT_FOUND)

        if car.owner is None:
            return Response({'detail': 'This listing does not have a seller yet.'}, status=status.HTTP_400_BAD_REQUEST)

        if car.owner_id == request.user.id:
            return Response({'detail': 'You cannot message yourself about your own listing.'}, status=status.HTTP_400_BAD_REQUEST)

        conversation, created = Conversation.objects.get_or_create(
            car=car,
            buyer=request.user,
            seller=car.owner,
        )

        if text:
            Message.objects.create(conversation=conversation, sender=request.user, text=text)
            conversation.save(update_fields=['updated_at'])

        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=response_status)

    def retrieve(self, request, *args, **kwargs):
        conversation = self.get_object()
        conversation.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='messages')
    def messages(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            text=serializer.validated_data['text'],
        )
        conversation.save(update_fields=['updated_at'])
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        return Response(self.get_serializer(conversation).data)


class RentalBookingViewSet(viewsets.ModelViewSet):
    serializer_class = RentalBookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            RentalBooking.objects.select_related('car', 'renter', 'seller')
            .filter(Q(renter=self.request.user) | Q(seller=self.request.user))
        )

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        car = serializer.validated_data['car']
        if car.owner is None:
            return Response({'detail': 'This car does not have a seller.'}, status=status.HTTP_400_BAD_REQUEST)

        if car.owner_id == request.user.id:
            return Response({'detail': 'You cannot book your own car.'}, status=status.HTTP_400_BAD_REQUEST)

        if not car.is_available_for_rent or car.status != Car.STATUS_ACTIVE:
            return Response({'detail': 'This car is not available for rent.'}, status=status.HTTP_400_BAD_REQUEST)

        days = (serializer.validated_data['end_date'] - serializer.validated_data['start_date']).days + 1
        if days < car.minimum_rent_days:
            return Response(
                {'detail': f'Minimum rental period is {car.minimum_rent_days} day(s).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        daily_price = car.rent_price_per_day or (Decimal(car.price) * Decimal('0.004')).quantize(Decimal('1.00'), rounding=ROUND_HALF_UP)
        daily_price = max(daily_price, Decimal('35.00'))
        booking = RentalBooking.objects.create(
            car=car,
            renter=request.user,
            seller=car.owner,
            start_date=serializer.validated_data['start_date'],
            end_date=serializer.validated_data['end_date'],
            pickup_location=serializer.validated_data['pickup_location'],
            dropoff_location=serializer.validated_data.get('dropoff_location', ''),
            total_price=(daily_price * days).quantize(Decimal('1.00'), rounding=ROUND_HALF_UP),
            deposit=car.rent_deposit or Decimal('0.00'),
        )

        return Response(self.get_serializer(booking).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        booking = self.get_object()
        if booking.seller_id != request.user.id:
            return Response({'detail': 'Only the seller can confirm this booking.'}, status=status.HTTP_403_FORBIDDEN)

        booking.status = RentalBooking.STATUS_CONFIRMED
        booking.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        booking.status = RentalBooking.STATUS_CANCELLED
        booking.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(booking).data)
