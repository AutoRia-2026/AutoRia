from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import SellerProfile

from .models import Car, CarComment, CarImage, CarLike, CarReview, Conversation, Message, RentalBooking, SavedSearch


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

    def test_filter_by_model_name(self):
        response = self.client.get('/api/cars/?model=X3')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['model'], 'X3')

    def test_filter_by_price_range(self):
        response = self.client.get('/api/cars/?price_min=30000&price_max=40000')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['model'], 'X5')

    def test_filter_by_year_range(self):
        response = self.client.get('/api/cars/?year_min=2020&year_max=2022')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)

    def test_filter_by_mileage_range(self):
        response = self.client.get('/api/cars/?mileage_min=30000&mileage_max=60000')

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

    def test_filter_by_color_and_body_type(self):
        Car.objects.filter(model='X5').update(color='White', body_type='SUV')

        response = self.client.get('/api/cars/?color=White&body_type=SUV')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['model'], 'X5')

    def test_filter_rental_cars(self):
        Car.objects.filter(model='X3').update(is_available_for_rent=False)

        response = self.client.get('/api/cars/?rental=true')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 2)
        self.assertTrue(all(car['is_available_for_rent'] for car in response.data['results']))

    def test_car_response_includes_rental_fields(self):
        Car.objects.filter(model='X5').update(
            rent_price_per_day='140.00',
            rent_price_per_week='850.00',
            rent_deposit='500.00',
            minimum_rent_days=2,
        )

        response = self.client.get('/api/cars/?model=X5')

        self.assertEqual(response.status_code, 200)
        car = response.data['results'][0]
        self.assertEqual(car['rent_price_per_day'], '140.00')
        self.assertEqual(car['rent_price_per_week'], '850.00')
        self.assertEqual(car['rent_deposit'], '500.00')
        self.assertEqual(car['minimum_rent_days'], 2)
        self.assertEqual(car['effective_rent_price_per_day'], '140.00')


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

    def test_favorites_endpoint_returns_liked_cars(self):
        other_car = Car.objects.create(
            owner=self.user,
            brand='Audi',
            model='A6',
            year=2019,
            mileage=50000,
            price='26000.00',
            transmission='automatic',
            fuel_type='petrol',
        )
        CarLike.objects.create(user=self.user, car=other_car)
        self.client.force_authenticate(user=self.user)

        response = self.client.get('/api/cars/favorites/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['brand'], 'Audi')


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

    def test_owner_can_promote_listing(self):
        user = get_user_model().objects.create_user(
            username='promoteuser',
            email='promote@example.com',
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
        response = self.client.post(f'/api/cars/{car.id}/promote/')

        car.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(car.is_promoted)
        self.assertTrue(response.data['is_promoted'])

    def test_user_can_save_search(self):
        user = get_user_model().objects.create_user(
            username='savedsearchuser',
            email='savedsearch@example.com',
            password='StrongPass123',
        )

        self.client.force_authenticate(user=user)
        response = self.client.post(
            '/api/cars/saved-searches/',
            {
                'title': 'BMW petrol',
                'query': 'BMW',
                'filters': {'fuel_type': 'petrol', 'price_max': '30000'},
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(SavedSearch.objects.count(), 1)
        self.assertEqual(response.data['title'], 'BMW petrol')


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


class SellListingTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='sellercreate',
            email='sellercreate@example.com',
            password='StrongPass123',
        )
        self.client.force_authenticate(user=self.user)

    def test_authenticated_user_can_publish_listing(self):
        response = self.client.post(
            '/api/cars/',
            {
                'brand': 'BMW',
                'model': 'X6',
                'year': 2024,
                'mileage': 12000,
                'price': '78000.00',
                'transmission': 'automatic',
                'fuel_type': 'petrol',
                'body_type': 'SUV',
                'condition': 'Used-Excellent',
                'color': 'Black',
                'status': Car.STATUS_ACTIVE,
                'is_available_for_rent': True,
                'rent_price_per_day': '220.00',
                'rent_price_per_week': '1300.00',
                'rent_deposit': '1000.00',
                'minimum_rent_days': 2,
                'images': [
                    {'image_url': 'https://example.com/x6-front.jpg', 'position': 0},
                    {'image_url': 'https://example.com/x6-side.jpg', 'position': 1},
                ],
            },
            format='json',
        )

        car = Car.objects.get(model='X6')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(car.owner, self.user)
        self.assertEqual(car.status, Car.STATUS_ACTIVE)
        self.assertEqual(car.body_type, 'SUV')
        self.assertEqual(car.condition, 'Used-Excellent')
        self.assertEqual(car.color, 'Black')
        self.assertEqual(car.images.count(), 2)
        self.assertEqual(response.data['effective_rent_price_per_day'], '220.00')

    def test_authenticated_user_can_save_listing_draft(self):
        response = self.client.post(
            '/api/cars/',
            {
                'brand': 'Audi',
                'model': 'A7',
                'year': 2022,
                'mileage': 35000,
                'price': '55000.00',
                'transmission': 'automatic',
                'fuel_type': 'diesel',
                'status': Car.STATUS_HIDDEN,
            },
            format='json',
        )

        car = Car.objects.get(model='A7')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(car.status, Car.STATUS_HIDDEN)
        self.assertEqual(car.owner, self.user)


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


class CarReviewTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='reviewuser',
            email='review@example.com',
            password='StrongPass123',
        )
        self.car = Car.objects.create(
            owner=self.user,
            brand='Porsche',
            model='911 GT3 RS',
            year=2023,
            mileage=2500,
            price='385000.00',
            transmission='automatic',
            fuel_type='petrol',
        )

    def test_authenticated_user_can_create_review(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f'/api/cars/{self.car.id}/reviews/',
            {'rating': 5, 'text': 'Great seller and clean car.', 'recommend_seller': True},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(CarReview.objects.count(), 1)
        self.assertEqual(response.data['rating'], 5)

    def test_user_cannot_review_same_car_twice(self):
        self.client.force_authenticate(user=self.user)
        CarReview.objects.create(
            car=self.car,
            user=self.user,
            rating=5,
            text='First review.',
        )

        response = self.client.post(
            f'/api/cars/{self.car.id}/reviews/',
            {'rating': 4, 'text': 'Second review.', 'recommend_seller': True},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(CarReview.objects.count(), 1)

    def test_public_reviews_endpoint_returns_reviews(self):
        CarReview.objects.create(
            car=self.car,
            user=self.user,
            rating=5,
            text='Verified purchase.',
        )

        response = self.client.get('/api/cars/reviews/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['car_title'], 'Porsche 911 GT3 RS 2023')


class ConversationTests(APITestCase):
    def setUp(self):
        self.seller = get_user_model().objects.create_user(
            username='messageseller',
            email='messageseller@example.com',
            password='StrongPass123',
        )
        self.buyer = get_user_model().objects.create_user(
            username='messagebuyer',
            email='messagebuyer@example.com',
            password='StrongPass123',
        )
        self.other_user = get_user_model().objects.create_user(
            username='messageother',
            email='messageother@example.com',
            password='StrongPass123',
        )
        self.car = Car.objects.create(
            owner=self.seller,
            brand='BMW',
            model='X5',
            year=2024,
            mileage=9000,
            price='72000.00',
            transmission='automatic',
            fuel_type='diesel',
        )

    def test_buyer_can_start_conversation_with_seller(self):
        self.client.force_authenticate(user=self.buyer)

        response = self.client.post(
            '/api/cars/conversations/',
            {'car': self.car.id, 'text': 'Is this BMW available?'},
            format='json',
        )

        conversation = Conversation.objects.get()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(conversation.buyer, self.buyer)
        self.assertEqual(conversation.seller, self.seller)
        self.assertEqual(conversation.messages.count(), 1)
        self.assertEqual(response.data['latest_message']['text'], 'Is this BMW available?')

    def test_owner_cannot_start_conversation_with_self(self):
        self.client.force_authenticate(user=self.seller)

        response = self.client.post(
            '/api/cars/conversations/',
            {'car': self.car.id, 'text': 'Own listing'},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Conversation.objects.count(), 0)

    def test_list_returns_only_user_conversations(self):
        own_conversation = Conversation.objects.create(car=self.car, buyer=self.buyer, seller=self.seller)
        other_car = Car.objects.create(
            owner=self.other_user,
            brand='Audi',
            model='A6',
            year=2022,
            mileage=20000,
            price='47000.00',
            transmission='automatic',
            fuel_type='petrol',
        )
        Conversation.objects.create(car=other_car, buyer=self.seller, seller=self.other_user)
        self.client.force_authenticate(user=self.buyer)

        response = self.client.get('/api/cars/conversations/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], own_conversation.id)

    def test_participant_can_send_message(self):
        conversation = Conversation.objects.create(car=self.car, buyer=self.buyer, seller=self.seller)
        self.client.force_authenticate(user=self.seller)

        response = self.client.post(
            f'/api/cars/conversations/{conversation.id}/messages/',
            {'text': 'Yes, it is available.'},
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(response.data['sender'], self.seller.id)

    def test_retrieve_marks_incoming_messages_as_read(self):
        conversation = Conversation.objects.create(car=self.car, buyer=self.buyer, seller=self.seller)
        message = Message.objects.create(conversation=conversation, sender=self.buyer, text='Hello')
        self.client.force_authenticate(user=self.seller)

        response = self.client.get(f'/api/cars/conversations/{conversation.id}/')

        message.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(message.is_read)


class RentalBookingTests(APITestCase):
    def setUp(self):
        self.seller = get_user_model().objects.create_user(
            username='rentalseller',
            email='rentalseller@example.com',
            password='StrongPass123',
        )
        self.renter = get_user_model().objects.create_user(
            username='rentalrenter',
            email='rentalrenter@example.com',
            password='StrongPass123',
        )
        self.car = Car.objects.create(
            owner=self.seller,
            brand='Porsche',
            model='Macan',
            year=2023,
            mileage=14000,
            price='65000.00',
            transmission='automatic',
            fuel_type='petrol',
            is_available_for_rent=True,
            rent_price_per_day='180.00',
            rent_deposit='700.00',
            minimum_rent_days=2,
        )
        self.start_date = timezone.localdate() + timedelta(days=3)
        self.end_date = self.start_date + timedelta(days=2)

    def test_renter_can_create_booking(self):
        self.client.force_authenticate(user=self.renter)

        response = self.client.post(
            '/api/cars/bookings/',
            {
                'car': self.car.id,
                'start_date': self.start_date.isoformat(),
                'end_date': self.end_date.isoformat(),
                'pickup_location': 'Kyiv Center',
                'dropoff_location': 'Kyiv Center',
            },
            format='json',
        )

        booking = RentalBooking.objects.get()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(booking.renter, self.renter)
        self.assertEqual(booking.seller, self.seller)
        self.assertEqual(booking.total_price, 540)
        self.assertEqual(booking.deposit, 700)
        self.assertEqual(response.data['status'], RentalBooking.STATUS_PENDING)

    def test_booking_respects_minimum_rent_days(self):
        self.client.force_authenticate(user=self.renter)

        response = self.client.post(
            '/api/cars/bookings/',
            {
                'car': self.car.id,
                'start_date': self.start_date.isoformat(),
                'end_date': self.start_date.isoformat(),
                'pickup_location': 'Kyiv Center',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(RentalBooking.objects.count(), 0)

    def test_owner_cannot_book_own_car(self):
        self.client.force_authenticate(user=self.seller)

        response = self.client.post(
            '/api/cars/bookings/',
            {
                'car': self.car.id,
                'start_date': self.start_date.isoformat(),
                'end_date': self.end_date.isoformat(),
                'pickup_location': 'Kyiv Center',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 400)

    def test_seller_can_confirm_booking(self):
        booking = RentalBooking.objects.create(
            car=self.car,
            renter=self.renter,
            seller=self.seller,
            start_date=self.start_date,
            end_date=self.end_date,
            pickup_location='Kyiv Center',
            total_price='540.00',
            deposit='700.00',
        )
        self.client.force_authenticate(user=self.seller)

        response = self.client.post(f'/api/cars/bookings/{booking.id}/confirm/')

        booking.refresh_from_db()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(booking.status, RentalBooking.STATUS_CONFIRMED)

    def test_renter_cannot_confirm_booking(self):
        booking = RentalBooking.objects.create(
            car=self.car,
            renter=self.renter,
            seller=self.seller,
            start_date=self.start_date,
            end_date=self.end_date,
            pickup_location='Kyiv Center',
            total_price='540.00',
            deposit='700.00',
        )
        self.client.force_authenticate(user=self.renter)

        response = self.client.post(f'/api/cars/bookings/{booking.id}/confirm/')

        self.assertEqual(response.status_code, 403)
