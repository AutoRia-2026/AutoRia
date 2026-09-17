from decimal import Decimal
from urllib.parse import quote

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import SellerProfile
from cars.models import Car, CarImage


def commons_image(file_name):
    return f'https://commons.wikimedia.org/wiki/Special:FilePath/{quote(file_name)}?width=1200'


def car(brand, model, year, mileage, price, fuel_type, transmission, body_type, condition, color, rent, daily, images):
    return {
        'brand': brand,
        'model': model,
        'year': year,
        'mileage': mileage,
        'price': price,
        'fuel_type': fuel_type,
        'transmission': transmission,
        'body_type': body_type,
        'condition': condition,
        'color': color,
        'is_available_for_rent': rent,
        'rent_price_per_day': daily,
        'rent_price_per_week': str(int(daily) * 6) if daily else None,
        'rent_deposit': str(max(int(daily) * 6, 350)) if daily else None,
        'minimum_rent_days': 2 if rent else 1,
        'images': images,
    }


CATALOG_CARS = [
    car('BMW', 'X5 xDrive40i', 2020, 64000, '47500', 'petrol', 'automatic', 'SUV', 'Used - Excellent', 'Black', True, '145', ['BMW X5 (G05) China.jpg', 'BMW X5 (G05) China (4).jpg', 'BMW X5 M (G05) 1X7A7047.jpg']),
    car('BMW', '330i G20 M Sport', 2019, 72000, '31500', 'petrol', 'automatic', 'Sedan', 'Used - Excellent', 'Blue', False, None, ['BMW 330i G20 M Sport 2019.jpg', 'BMW 3-Series G20 Fantuan.jpg', '2019 BMW 3 series rearview.jpg']),
    car('Audi', 'A6 45 TFSI quattro', 2018, 88000, '29900', 'petrol', 'automatic', 'Sedan', 'Used - Good', 'Silver', False, None, ['Audi A6, GIMS 2018, Le Grand-Saconnex (1X7A1490).jpg', 'Audi A6 2018 (44686504882).jpg', 'Audi A6 C7 (Type 4G) Wien 25 July 2020 JM.jpg']),
    car('Audi', 'Q5 50 TFSI e', 2021, 51000, '42900', 'hybrid', 'automatic', 'SUV', 'Used - Excellent', 'White', True, '135', ['Audi Q5 FY 50 TFSI e Facelift IMG 5284.jpg', 'Audi Q5 FY Facelift IMG 4139.jpg', 'Audi Q5 Sportback IMG 5021.jpg']),
    car('Tesla', 'Model 3 Long Range', 2021, 42000, '37900', 'electric', 'automatic', 'Sedan', 'Used - Excellent', 'Red', True, '120', ['2019 Tesla Model 3 Long Range Dual Motor in Red Multi-Coat, front left, 2021-05-30.jpg', 'Tesla Model 3 2021 facelift.jpg', 'The rearview of TESLA MODEL 3.jpg']),
    car('Tesla', 'Model Y Long Range', 2020, 55000, '44500', 'electric', 'automatic', 'SUV', 'Used - Excellent', 'White', False, None, ['2020 Tesla Model Y, front 8.1.20.jpg', 'Tesla Model Y 1X7A6211.jpg', 'Tesla Model Y front view 7-19-2020.jpg']),
    car('Toyota', 'Camry Hybrid XV70', 2019, 76000, '24500', 'hybrid', 'automatic', 'Sedan', 'Used - Good', 'White', True, '78', ['2019 Toyota Camry (XV70) 2.5 V, East Surabaya.jpg', '2019 Toyota Camry LE.jpg', 'Toyota Camry (XV70) SE (2), United States.jpg']),
    car('Toyota', 'RAV4 Hybrid XA50', 2021, 39000, '36500', 'hybrid', 'automatic', 'SUV', 'Used - Excellent', 'Grey', False, None, ['2021 Toyota RAV4 PHV.jpg', 'TOYOTA RAV4 (XA50) TAIL LAMP.jpg', 'TOYOTA RAV4 (XA50) TAIL LAMP (2).jpg']),
    car('Volkswagen', 'Golf GTI Clubsport', 2017, 118000, '19800', 'petrol', 'manual', 'Hatchback', 'Used - Good', 'White', False, None, ['2017 Volkswagen Golf GTi Auto.jpg', '2017 Volkswagen Golf GTi Clubsport Edition 40 BS O24.jpg', '2017 Volkswagen Golf GTi Clubsport S.jpg']),
    car('Volkswagen', 'Passat Business 140TSI', 2020, 61000, '27900', 'petrol', 'automatic', 'Wagon', 'Used - Excellent', 'Grey', True, '88', ['2020 Volkswagen Passat Business 140TSI front.jpg', '2020 Volkswagen Passat Business 140TSI rear.jpg', 'Volkswagen Passat B8 GTE (2019) IMG 0384.jpg']),
    car('Ford', 'Focus SE', 2016, 112000, '11200', 'petrol', 'manual', 'Hatchback', 'Used - Good', 'Blue', False, None, ['2016 Ford Focus 2.0 SE Plus (Argentina).jpg', '2016 Ford Focus RS 11.jpg', '2016 Ford Focus RS 12.jpg']),
    car('Ford', 'Mustang Mach-E GT', 2021, 36000, '52900', 'electric', 'automatic', 'SUV', 'Used - Excellent', 'Orange', True, '170', ['2021 Ford Mustang Mach-E GT.jpg', 'Ford Mustang Mach-E GT IAA 2021 1X7A0176.jpg', 'Ford Mustang Mach-E IAA 2021 1X7A0236.jpg']),
    car('Land Rover', 'Range Rover Sport P400', 2023, 19000, '95000', 'petrol', 'automatic', 'SUV', 'Used - Excellent', 'Grey', True, '310', ['2023 Range Rover Sport (39954).jpg', '2023 Range Rover Sport SV Edition One Carbon Bronze.jpg', 'Range Rover Sport Series III 1X7A7071.jpg']),
    car('Mercedes-Benz', 'GLC 250 4MATIC', 2018, 82000, '32500', 'petrol', 'automatic', 'SUV', 'Used - Excellent', 'Grey', True, '115', ['2018 Mercedes-Benz GLC 250 Urban Edition 4MATIC 2.0 Front.jpg', '2018 Mercedes-Benz GLC 250 Urban Edition 4MATIC 2.0 Rear.jpg', '2016-2018 Mercedes-Benz GLC 250 (X 253) 4MATIC wagon (2018-10-01) 02.jpg']),
    car('Mercedes-Benz', 'E-Class W213', 2020, 57000, '43800', 'diesel', 'automatic', 'Sedan', 'Used - Excellent', 'Black', False, None, ['MERCEDES-BENZ E-CLASS (W213) China.jpg', 'MERCEDES-BENZ E-CLASS (W213) China (3).jpg', 'MERCEDES-BENZ E-CLASS (W213) China (4).jpg']),
    car('Hyundai', 'Tucson 2.0 CRDi', 2017, 94000, '17600', 'diesel', 'automatic', 'SUV', 'Used - Good', 'Black', True, '68', ['2017 Hyundai Tucson Premium CRDi Automatic 2.0.jpg', 'Hyundai Tucson 1591cc registered May 2017 in Brecon.jpg', 'Hyundai Tucson 1591cc registered September 2017.jpg']),
    car('Hyundai', 'Santa Fe TM', 2021, 47000, '34900', 'diesel', 'automatic', 'SUV', 'Used - Excellent', 'Blue', False, None, ['Hyundai Santa Fe (TM) IMG001.jpg', '0 Hyundai Santa Fe (CM) 1.jpg', '0 Hyundai Santa Fe (CM) 2.jpg']),
    car('Porsche', 'Taycan 4S', 2020, 28000, '88000', 'electric', 'automatic', 'Sedan', 'Used - Excellent', 'White', True, '285', ['2020 Porsche Taycan 4S.jpg', '2020 Porsche Taycan Turbo (51596).jpg', '2020 Porsche Taycan Turbo S (21742).jpg']),
    car('Porsche', 'Cayenne Coupe GTS', 2019, 59000, '73500', 'petrol', 'automatic', 'SUV', 'Used - Excellent', 'Red', False, None, ['Porsche Cayenne Coupé GTS 1X7A7224.jpg', 'Porsche Cayenne S Hybrid Concept IMG 0840.jpg', 'Porsche Cayenne Turbo GT Auto Zuerich 2021 IMG 0298.jpg']),
    car('Kia', 'Sportage NQ5', 2022, 31000, '31800', 'hybrid', 'automatic', 'SUV', 'Used - Excellent', 'Green', True, '96', ['Kia Sportage (NQ5) 1X7A0319.jpg', 'Kia Sportage (NQ5) 1X7A0328.jpg', 'Kia Sportage Plug-in-Hybrid (NQ5) 1X7A0317.jpg']),
    car('Kia', 'Cerato S', 2020, 68000, '15800', 'petrol', 'automatic', 'Sedan', 'Used - Good', 'White', False, None, ['2020 Kia Cerato S front.jpg', '2020 Kia Cerato S hatchback rear.jpg', '2020 Kia Cerato S rear.jpg']),
    car('Honda', 'Civic LX Sedan', 2019, 69000, '18900', 'petrol', 'automatic', 'Sedan', 'Used - Good', 'Red', False, None, ['2019 Honda Civic LX Sedan.jpg', '2019 Honda Civic LX Sedan (cropped).jpg', 'Honda Civic 2019 Facelift.jpg']),
    car('Honda', 'Civic Type R', 2019, 52000, '39800', 'petrol', 'manual', 'Hatchback', 'Used - Excellent', 'White', False, None, ['Honda Civic Type R limited Edition 2019.jpg', '2019 Honda Civic Type R.jpg', '2018 Honda Civic 1.5 E hatchback (FK4; 01-23-2019), South Tangerang.jpg']),
    car('Volvo', 'XC60 R-Design D5', 2018, 83000, '33700', 'diesel', 'automatic', 'SUV', 'Used - Excellent', 'Grey', True, '118', ['2018 Volvo XC60 R-Design D5 P-Pulse AWD Auto.jpg', 'Volvo XC60 R-Design D5 P-Pulse AWD Auto.jpg', '2018 Volvo XC60 T8 R-Design Pro Automatic 2.0 Front.jpg']),
]


class Command(BaseCommand):
    help = 'Seed realistic DriveHub catalog cars with matching public Wikimedia Commons photos.'

    def handle(self, *args, **options):
        User = get_user_model()
        seller, _ = User.objects.get_or_create(
            username='drivehub_seller',
            defaults={
                'email': 'seller@drivehub.ua',
                'first_name': 'DriveHub',
                'last_name': 'Seller',
                'is_active': True,
            },
        )
        seller.set_password('DriveHubSeller123!')
        seller.save()
        SellerProfile.objects.update_or_create(
            user=seller,
            defaults={
                'phone': '+380674567890',
                'city': 'Kyiv',
                'country': 'Ukraine',
                'street_address': 'Khreshchatyk 22',
                'state_province': 'Kyiv',
            },
        )

        Car.objects.filter(owner=seller).delete()
        Car.objects.filter(model__icontains='Test').delete()
        Car.objects.filter(brand__icontains='Test').delete()
        Car.objects.filter(owner__isnull=True, image_url__icontains='images.unsplash.com').delete()
        Car.objects.filter(owner__isnull=True, image_url__icontains='example.com').delete()

        created_count = 0
        for index, data in enumerate(CATALOG_CARS):
            primary_image_url = commons_image(data['images'][0])
            image_urls = [primary_image_url, primary_image_url, primary_image_url]
            description = (
                f"{data['year']} {data['brand']} {data['model']} with {data['fuel_type']} powertrain, "
                f"{data['transmission']} transmission, {data['body_type'].lower()} body and verified listing photos."
            )
            car_object = Car.objects.create(
                owner=seller,
                brand=data['brand'],
                model=data['model'],
                year=data['year'],
                mileage=data['mileage'],
                price=Decimal(data['price']),
                is_available_for_rent=data['is_available_for_rent'],
                rent_price_per_day=Decimal(data['rent_price_per_day']) if data['rent_price_per_day'] else None,
                rent_price_per_week=Decimal(data['rent_price_per_week']) if data['rent_price_per_week'] else None,
                rent_deposit=Decimal(data['rent_deposit']) if data['rent_deposit'] else None,
                minimum_rent_days=data['minimum_rent_days'],
                transmission=data['transmission'],
                fuel_type=data['fuel_type'],
                body_type=data['body_type'],
                condition=data['condition'],
                color='',
                image_url=primary_image_url,
                description=description,
                status=Car.STATUS_ACTIVE,
                is_promoted=index < 5,
                views_count=360 - (index * 9),
            )
            for position, image_url in enumerate(image_urls):
                CarImage.objects.create(car=car_object, image_url=image_url, position=position)
            created_count += 1

        self.stdout.write(self.style.SUCCESS(f'Seeded {created_count} realistic catalog cars.'))
