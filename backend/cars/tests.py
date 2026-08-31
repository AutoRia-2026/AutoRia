from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Car, CarLike


class CarFilterTests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username='filteruser',
            email='filter@example.com',
            password='StrongPass123',
        )

        Car.objects.create(
            owner=user,
            brand='BMW',
            model='X5',
            year=2020,
            mileage=60000,
            price='35000.00',
            transmission='automatic',
            fuel_type='diesel',
        )
        Car.objects.create(
            owner=user,
            brand='Audi',
            model='A6',
            year=2018,
            mileage=90000,
            price='25000.00',
            transmission='automatic',
            fuel_type='petrol',
        )
        Car.objects.create(
            owner=user,
            brand='BMW',
            model='X3',
            year=2022,
            mileage=30000,
            price='45000.00',
            transmission='automatic',
            fuel_type='petrol',
        )

    def test_filter_by_brand_exact_match(self):
        response = self.client.get('/api/cars/?brand=BMW')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
        self.assertTrue(all(car['brand'] == 'BMW' for car in response.data['results']))

    def test_filter_by_fuel_type_exact_match(self):
        response = self.client.get('/api/cars/?fuel_type=diesel')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['fuel_type'], 'diesel')

    def test_filter_by_price_range(self):
        response = self.client.get('/api/cars/?price_min=30000&price_max=40000')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['model'], 'X5')

    def test_filter_by_year_range(self):
        response = self.client.get('/api/cars/?year_min=2020&year_max=2022')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)

    def test_filter_by_combined_parameters(self):
        response = self.client.get(
            '/api/cars/?brand=BMW&fuel_type=petrol&price_min=40000&year_min=2021'
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['model'], 'X3')

    def test_search_by_brand_model_or_description(self):
        response = self.client.get('/api/cars/?search=A6')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['brand'], 'Audi')

    def test_ordering_by_price_desc(self):
        response = self.client.get('/api/cars/?ordering=-price')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'][0]['model'], 'X3')


class CarPaginationTests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username='paginationuser',
            email='pagination@example.com',
            password='StrongPass123',
        )

        for index in range(15):
            Car.objects.create(
                owner=user,
                brand='BMW',
                model=f'Model {index}',
                year=2020,
                mileage=10000 + index,
                price='30000.00',
                transmission='automatic',
                fuel_type='diesel',
            )

    def test_cars_are_paginated_by_10_items(self):
        response = self.client.get('/api/cars/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 15)
        self.assertIsNotNone(response.data['next'])
        self.assertIsNone(response.data['previous'])
        self.assertEqual(len(response.data['results']), 10)

    def test_second_page_has_previous_link(self):
        response = self.client.get('/api/cars/?page=2')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 15)
        self.assertIsNone(response.data['next'])
        self.assertIsNotNone(response.data['previous'])
        self.assertEqual(len(response.data['results']), 5)


class CarLikeTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='likeuser',
            email='like@example.com',
            password='StrongPass123',
        )
        self.car = Car.objects.create(
            owner=self.user,
            brand='BMW',
            model='X5',
            year=2020,
            mileage=60000,
            price='35000.00',
            transmission='automatic',
            fuel_type='diesel',
        )

    def test_user_can_like_car_once(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(f'/api/cars/{self.car.id}/like/')

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['liked'])
        self.assertEqual(CarLike.objects.count(), 1)

    def test_user_cannot_like_same_car_twice(self):
        self.client.force_authenticate(user=self.user)
        self.client.post(f'/api/cars/{self.car.id}/like/')

        response = self.client.post(f'/api/cars/{self.car.id}/like/')

        self.assertEqual(response.status_code, 400)
        self.assertEqual(CarLike.objects.count(), 1)

    def test_user_can_remove_like(self):
        self.client.force_authenticate(user=self.user)
        CarLike.objects.create(user=self.user, car=self.car)

        response = self.client.delete(f'/api/cars/{self.car.id}/like/')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['liked'])
        self.assertEqual(CarLike.objects.count(), 0)
