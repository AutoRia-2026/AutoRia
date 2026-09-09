import type { Car } from '../types/cars'
import { carTitle, fallbackImage, formatMileage, formatPrice } from '../utils/cars'

type BuyCarCardProps = {
  car: Car
  openCar: (car: Car) => void
  toggleLike: (car: Car) => void
}

function BuyCarCard({ car, openCar, toggleLike }: BuyCarCardProps) {
  const priceNumber = Number(car.price)
  const oldPrice = Math.round(priceNumber * 1.12)
  const badge = priceNumber < 30000 ? 'Good price' : priceNumber > 70000 ? 'Great price' : 'Fair price'

  return (
    <article className="buy-car-card">
      <div className="buy-card-media">
        <button type="button" onClick={() => openCar(car)}>
          <img src={fallbackImage(car)} alt={carTitle(car)} />
        </button>
        <span>Trusted Seller</span>
        <button type="button" aria-label="Like car" onClick={() => toggleLike(car)}>
          Like
        </button>
      </div>
      <div className="buy-card-body">
        <div className="buy-card-title">
          <button type="button" onClick={() => openCar(car)}>{carTitle(car)}</button>
          <span>{badge}</span>
        </div>
        <strong>{formatPrice(car.price)}</strong>
        <div className="buy-card-meta">
          <span>{formatMileage(car.mileage)}</span>
          <span>{car.transmission}</span>
          <span>{car.fuel_type}</span>
          <span>2.0L</span>
        </div>
        <div className="buy-card-footer">
          <span>{car.seller?.city || 'London, UK'}</span>
          <span>{oldPrice > priceNumber ? `${formatPrice(String(oldPrice))} old` : 'Just now'}</span>
        </div>
      </div>
    </article>
  )
}

export default BuyCarCard
