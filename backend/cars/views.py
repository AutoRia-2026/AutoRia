from django.db.models import F, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Car, CarLike
from .pagination import CarPagination
from .permissions import IsOwnerOrReadOnly
from .serializers import CarSerializer


class CarViewSet(viewsets.ModelViewSet):
    queryset = Car.objects.all()
    serializer_class = CarSerializer
    permission_classes = [IsOwnerOrReadOnly]
    pagination_class = CarPagination

    def get_queryset(self):
        queryset = Car.objects.all()
        params = self.request.query_params

        brand = params.get('brand')
        fuel_type = params.get('fuel_type')
        price_min = params.get('price_min')
        price_max = params.get('price_max')
        year_min = params.get('year_min')
        year_max = params.get('year_max')
        search = params.get('search')
        ordering = params.get('ordering')

        if brand:
            queryset = queryset.filter(brand__iexact=brand)

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

        if search:
            queryset = queryset.filter(
                Q(brand__icontains=search)
                | Q(model__icontains=search)
                | Q(description__icontains=search)
            )

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
