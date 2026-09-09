import type { FormEvent } from 'react'
import type { Car, CarComment } from '../types/cars'
import BuyCarCard from '../components/BuyCarCard'
import { carTitle, fallbackImage, formatMileage, formatPrice } from '../utils/cars'

type CarDetailPageProps = {
  car: Car
  relatedCars: Car[]
  bidMessage: string
  commentText: string
  isCommentSending: boolean
  setCommentText: (value: string) => void
  setBidOpen: (value: boolean) => void
  openBooking: (car: Car) => void
  submitComment: (event: FormEvent<HTMLFormElement>) => void
  toggleLike: (car: Car) => void
  contactSeller: (car: Car) => void
  openCar: (car: Car) => void
  openReviews: () => void
  startReview: () => void
  showNotice: (message: string) => void
}

const features = [
  'Leather Seats',
  'Navigation System',
  'Apple CarPlay',
  'Android Auto',
  'Adaptive Cruise Control',
  'Parking Sensors',
]

function CarDetailPage({
  car,
  relatedCars,
  bidMessage,
  commentText,
  isCommentSending,
  setCommentText,
  setBidOpen,
  openBooking,
  submitComment,
  toggleLike,
  contactSeller,
  openCar,
  openReviews,
  startReview,
  showNotice,
}: CarDetailPageProps) {
  const reviews = car.reviews || []
  const firstReview = reviews[0]

  return (
    <section className="car-detail-page">
      <div className="detail-topbar">
        <div>
          <h1>{carTitle(car)}</h1>
          <p>{car.year} / {formatMileage(car.mileage)} / {car.fuel_type} / {car.transmission}</p>
        </div>
        <div>
          <button type="button" onClick={() => contactSeller(car)}>
            Contact Seller
          </button>
          {car.is_available_for_rent && (
            <button type="button" onClick={() => openBooking(car)}>
              Book rental
            </button>
          )}
          <button type="button" aria-label="Like car" onClick={() => toggleLike(car)}>Heart</button>
          <button type="button" aria-label="Share car" onClick={() => showNotice('Share link copied')}>Share</button>
        </div>
      </div>

      <section className="car-hero-panel">
        <img src={fallbackImage(car)} alt={carTitle(car)} />
        <div className="hero-chip-stack">
          <article><strong>{formatPrice(car.price)}</strong><span>Price</span></article>
          <article><strong>{car.brand}</strong><span>Brand</span></article>
          <article><strong>{car.fuel_type}</strong><span>Fuel type</span></article>
        </div>
        <p>{car.description || 'Verified marketplace listing with clear technical data, seller details and available vehicle history.'}</p>
      </section>

      {bidMessage && <p className="inline-success">{bidMessage}</p>}

      <div className="car-info-grid">
        <section className="detail-panel overview-panel">
          <h2>Overview</h2>
          <dl>
            <div><dt>Make</dt><dd>{car.brand}</dd></div>
            <div><dt>Body Type</dt><dd>Coupe</dd></div>
            <div><dt>Model</dt><dd>{car.model}</dd></div>
            <div><dt>Drive Type</dt><dd>RWD</dd></div>
            <div><dt>Year</dt><dd>{car.year}</dd></div>
            <div><dt>Engine</dt><dd>4.0L</dd></div>
            <div><dt>Mileage</dt><dd>{formatMileage(car.mileage)}</dd></div>
            <div><dt>Color</dt><dd>Ice Grey Metallic</dd></div>
            <div><dt>Fuel Type</dt><dd>{car.fuel_type}</dd></div>
            <div><dt>VIN</dt><dd>WP0AF2A95PS{String(car.id).padStart(5, '0')}</dd></div>
            <div><dt>Transmission</dt><dd>{car.transmission}</dd></div>
            <div><dt>Condition</dt><dd>Used-Excellent</dd></div>
          </dl>
        </section>

        <section className="detail-panel features-panel">
          <h2>Features</h2>
          {features.map((feature) => <span key={feature}>✓ {feature}</span>)}
        </section>

        <section className="detail-panel description-panel">
          <h2>Description</h2>
          <p>{car.description || `${carTitle(car)} is listed in verified condition with checked mileage, clean seller profile and marketplace-ready documents.`}</p>
        </section>

        <section className="detail-panel review-preview">
          <div>
            <h2>Reviews ({car.reviews_count || reviews.length})</h2>
            <button type="button" onClick={openReviews}>See all</button>
          </div>
          {firstReview ? (
            <article>
              <strong>{firstReview.username}</strong>
              <span>{'★'.repeat(firstReview.rating)}{'☆'.repeat(5 - firstReview.rating)}</span>
              <p>{firstReview.text}</p>
            </article>
          ) : (
            <article>
              <strong>No reviews yet</strong>
              <p>Be the first to describe your buying experience.</p>
              <button type="button" onClick={startReview}>Leave a review</button>
            </article>
          )}
        </section>
      </div>

      <section className="seller-question detail-panel">
        <div>
          <h2>Ask seller a question</h2>
          <span>{(car.comments || []).length} comments</span>
        </div>
        <form onSubmit={submitComment}>
          <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Ask about condition, service history or documents" />
          <button type="submit" disabled={isCommentSending || !commentText.trim()}>
            {isCommentSending ? 'Sending...' : 'Send'}
          </button>
        </form>
        {(car.comments || []).slice(0, 3).map((comment: CarComment) => (
          <p key={comment.id}><strong>{comment.username}</strong>{comment.text}</p>
        ))}
      </section>

      <section className="might-like">
        <div className="section-row">
          <h2>You also might like</h2>
          <button type="button" onClick={() => setBidOpen(true)}>Place Bid</button>
        </div>
        <div className="related-strip">
          {relatedCars.slice(0, 3).map((relatedCar) => (
            <BuyCarCard key={relatedCar.id} car={relatedCar} openCar={openCar} toggleLike={toggleLike} />
          ))}
        </div>
      </section>
    </section>
  )
}

export default CarDetailPage
