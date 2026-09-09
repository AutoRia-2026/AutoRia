import { heroImages } from '../constants/cars'
import type { Car } from '../types/cars'

export function formatPrice(price: string) {
  return `$${Math.round(Number(price)).toLocaleString('en-US')}`
}

export function formatMileage(mileage: number) {
  return `${mileage.toLocaleString('en-US')} mi`
}

export function carTitle(car: Car) {
  return `${car.year} ${car.brand} ${car.model}`
}

export function fallbackImage(car: Car) {
  return car.image_url || heroImages[car.id % heroImages.length]
}
