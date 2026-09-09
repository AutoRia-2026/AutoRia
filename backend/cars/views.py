from django.db.models import F, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Car, CarComment, CarLike, CarReview, SavedSearch
from .pagination import CarPagination
from .permissions import IsOwnerOrReadOnly
from .serializers import CarCommentSerializer, CarReviewSerializer, CarSerializer, SavedSearchSerializer


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

        if car_status in {Car.STATUS_ACTIVE, Car.STATUS_SOLD, Car.STATUS_HIDDEN}:
            queryset = queryset.filter(status=car_status)

        if search:
            for term in search.split():
                query = (
                    Q(brand__icontains=term)
                    | Q(model__icontains=term)
                    | Q(description__icontains=term)
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
