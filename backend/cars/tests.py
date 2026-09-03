from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from accounts.models import SellerProfile

from .models import Car, CarComment, CarImage, CarLike


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

    def test_search_by_year_and_brand_words(self):
        response = self.client.get('/api/cars/?search=2022%20BMW')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['model'], 'X3')

    def test_ordering_by_price_desc(self):
        response = self.client.get('/api/cars/?ordering=-price')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['results'][0]['model'], 'X3')

    def test_ordering_by_mileage_asc(self):
        response = self.client.get('/api/cars/?ordering=mileage')

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


class CarDetailTests(APITestCase):
    def test_detail_page_increments_views_count(self):
        user = get_user_model().objects.create_user(
            username='detailuser',
            email='detail@example.com',
            password='StrongPass123',
        )
        car = Car.objects.create(
            owner=user,
            brand='BMW',
            model='M4 CSL',
            year=2023,
            mileage=4500,
            price='150000.00',
            transmission='automatic',
            fuel_type='petrol',
        )

        response = self.client.get(f'/api/cars/{car.id}/')

        car.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['views_count'], 1)
        self.assertEqual(car.views_count, 1)


class MyCarsTests(APITestCase):
    def test_my_endpoint_returns_only_current_user_cars(self):
        user = get_user_model().objects.create_user(
            username='owneruser',
            email='owner@example.com',
            password='StrongPass123',
        )
        other_user = get_user_model().objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='StrongPass123',
        )
        Car.objects.create(
            owner=user,
            brand='BMW',
            model='M4',
            year=2023,
            mileage=4500,
            price='150000.00',
            transmission='automatic',
            fuel_type='petrol',
        )
        Car.objects.create(
            owner=other_user,
            brand='Audi',
            model='RS6',
            year=2022,
            mileage=12000,
            price='120000.00',
            transmission='automatic',
            fuel_type='petrol',
        )

        self.client.force_authenticate(user=user)
        response = self.client.get('/api/cars/my/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['brand'], 'BMW')

    def test_my_endpoint_requires_authentication(self):
        response = self.client.get('/api/cars/my/')

        self.assertEqual(response.status_code, 401)

    def test_my_endpoint_includes_hidden_owner_cars(self):
        user = get_user_model().objects.create_user(
            username='hiddenowner',
            email='hiddenowner@example.com',
            password='StrongPass123',
        )
        Car.objects.create(
            owner=user,
            brand='BMW',
            model='M4',
            year=2023,
            mileage=4500,
            price='150000.00',
            transmission='automatic',
            fuel_type='petrol',
            status=Car.STATUS_HIDDEN,
        )

        self.client.force_authenticate(user=user)
        response = self.client.get('/api/cars/my/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['status'], Car.STATUS_HIDDEN)


class CarImageTests(APITestCase):
    def test_create_car_with_multiple_images(self):
        user = get_user_model().objects.create_user(
            username='imageuser',
            email='image@example.com',
            password='StrongPass123',
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            '/api/cars/',
            {
                'brand': 'Porsche',
                'model': '718 Boxster',
                'year': 2021,
                'mileage': 6400,
                'price': '52000.00',
                'transmission': 'manual',
                'fuel_type': 'petrol',
                'description': 'Clean auction car.',
                'images': [
                    {'image_url': 'https://example.com/front.jpg', 'position': 0},
                    {'image_url': 'https://example.com/interior.jpg', 'position': 1},
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(CarImage.objects.count(), 2)
        self.assertEqual(len(response.data['images']), 2)

    def test_update_car_replaces_images(self):
        user = get_user_model().objects.create_user(
            username='replaceuser',
            email='replace@example.com',
            password='StrongPass123',
        )
        car = Car.objects.create(
            owner=user,
            brand='BMW',
            model='M4',
            year=2023,
            mileage=4500,
            price='150000.00',
            transmission='automatic',
            fuel_type='petrol',
        )
        CarImage.objects.create(car=car, image_url='https://example.com/old.jpg')
        self.client.force_authenticate(user=user)

        response = self.client.patch(
            f'/api/cars/{car.id}/',
            {
                'images': [
                    {'image_url': 'https://example.com/new.jpg', 'position': 0},
                ],
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(car.images.count(), 1)
        self.assertEqual(car.images.first().image_url, 'https://example.com/new.jpg')


class CarStatusTests(APITestCase):
    def test_public_list_shows_only_active_cars_by_default(self):
        user = get_user_model().objects.create_user(
            username='statususer',
            email='status@example.com',
            password='StrongPass123',
        )
        Car.objects.create(
            owner=user,
            brand='BMW',
            model='M4',
            year=2023,
            mileage=4500,
            price='150000.00',
            transmission='automatic',
            fuel_type='petrol',
            status=Car.STATUS_ACTIVE,
        )
        Car.objects.create(
            owner=user,
            brand='Audi',
            model='RS6',
            year=2022,
            mileage=12000,
            price='120000.00',
            transmission='automatic',
            fuel_type='petrol',
            status=Car.STATUS_HIDDEN,
        )

        response = self.client.get('/api/cars/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['brand'], 'BMW')


class SellerProfileTests(APITestCase):
    def test_car_response_includes_seller_contacts(self):
        user = get_user_model().objects.create_user(
            username='selleruser',
            email='seller@example.com',
            first_name='Seller',
            password='StrongPass123',
        )
        SellerProfile.objects.create(user=user, phone='+380501112233', city='Lviv')
        car = Car.objects.create(
            owner=user,
            brand='BMW',
            model='M4',
            year=2023,
            mileage=4500,
            price='150000.00',
            transmission='automatic',
            fuel_type='petrol',
        )

        response = self.client.get(f'/api/cars/{car.id}/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['seller']['phone'], '+380501112233')
        self.assertEqual(response.data['seller']['city'], 'Lviv')


class CarCommentTests(APITestCase):
    def test_authenticated_user_can_create_comment(self):
        user = get_user_model().objects.create_user(
            username='commentuser',
            email='comment@example.com',
            password='StrongPass123',
        )
        car = Car.objects.create(
            owner=user,
            brand='BMW',
            model='M4',
            year=2023,
            mileage=4500,
            price='150000.00',
            transmission='automatic',
            fuel_type='petrol',
        )

        self.client.force_authenticate(user=user)
        response = self.client.post(
            f'/api/cars/{car.id}/comments/',
            {'text': 'Is this car still available?'},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(CarComment.objects.count(), 1)
        self.assertEqual(response.data['text'], 'Is this car still available?')

    def test_car_detail_includes_comments(self):
        user = get_user_model().objects.create_user(
            username='commentowner',
            email='commentowner@example.com',
            password='StrongPass123',
        )
        car = Car.objects.create(
            owner=user,
            brand='BMW',
            model='M4',
            year=2023,
            mileage=4500,
            price='150000.00',
            transmission='automatic',
            fuel_type='petrol',
        )
        CarComment.objects.create(car=car, user=user, text='Clean title?')

        response = self.client.get(f'/api/cars/{car.id}/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['comments']), 1)
        self.assertEqual(response.data['comments'][0]['text'], 'Clean title?')
