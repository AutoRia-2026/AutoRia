from rest_framework import viewsets

from .models import Car
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

        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
