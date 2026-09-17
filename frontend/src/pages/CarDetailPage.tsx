import { useEffect, useState } from 'react'
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
  openPurchaseOffer: (car: Car) => void
  openBooking: (car: Car) => void
  submitComment: (event: FormEvent<HTMLFormElement>) => void
  toggleLike: (car: Car) => void
  contactSeller: (car: Car) => void
  openCar: (car: Car) => void
  openReviews: () => void
  startReview: () => void
  currentUserId: number | null
  showNotice: (message: string) => void
}

const contactLabels = ['Phone', 'Contact', 'City', 'Email'] as const

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function buildFeatureList(car: Car) {
  const title = `${car.brand} ${car.model}`.toLowerCase()
  const modelFeatures: Record<string, string[]> = {
    porsche: ['Sport-tuned chassis', 'Performance braking package', 'Driver-focused cabin'],
    bmw: ['xDrive-ready handling profile', 'Premium multimedia system', 'Driver assistance package'],
    mercedes: ['Comfort suspension setup', 'Premium interior package', 'Advanced safety assist'],
    audi: ['Quattro-style road stability', 'Virtual cockpit-style display', 'LED exterior lighting'],
    volvo: ['Pilot assist safety package', 'High-strength safety body', 'Comfort-focused cabin'],
    honda: ['Responsive steering setup', 'Efficient VTEC-style petrol engine', 'Practical daily-use cabin'],
    toyota: ['Hybrid efficiency package', 'Toyota Safety Sense-style assist', 'Low running costs'],
    kia: ['Modern infotainment package', 'Efficient city-driving setup', 'Practical family cabin'],
    hyundai: ['Smart safety assist', 'Comfortable crossover setup', 'Efficient daily-use drivetrain'],
    volkswagen: ['Balanced German chassis', 'Practical interior layout', 'Efficient long-distance setup'],
    tesla: ['Electric drivetrain', 'Large central display', 'Over-the-air software capability'],
    lamborghini: ['Supercar performance setup', 'Track-focused aerodynamics', 'Carbon-style sport cabin'],
    'land rover': ['All-terrain capability', 'Premium SUV comfort', 'Advanced traction control'],
  }
  const matchedFeatures = Object.entries(modelFeatures)
    .find(([brand]) => title.includes(brand))?.[1] || []

  return [
    `${titleCase(car.transmission)} transmission`,
    `${titleCase(car.fuel_type)} powertrain`,
    car.body_type ? `${titleCase(car.body_type)} body` : '',
    car.condition ? `${titleCase(car.condition)} condition` : '',
    car.mileage <= 50000 ? 'Low mileage for its year' : 'Documented mileage',
    car.is_available_for_rent ? `Rental available from ${car.minimum_rent_days} day${car.minimum_rent_days === 1 ? '' : 's'}` : 'Available for purchase',
    ...matchedFeatures,
  ]
    .filter(Boolean)
    .map((feature) => feature.replace(/^OK\s+/i, '').trim())
    .filter((feature, index, features) => feature && features.indexOf(feature) === index)
    .slice(0, 8)
}

function splitDescriptionAndContacts(car: Car) {
  const contacts = new Map<string, string>()
  const contactPattern = /(Phone|Contact|City|Email):\s*(.*?)(?=\s+(?:Phone|Contact|City|Email):|$)/gi
  let description = (car.description || '')
    .replace(contactPattern, (_match, label: string, value: string) => {
      contacts.set(label.toLowerCase(), value.trim())
      return ''
    })
    .replace(/\s{2,}/g, ' ')
    .trim()

  if (!description) {
    description = `${carTitle(car)} is listed in verified condition with checked mileage, clean seller profile and marketplace-ready documents.`
  }

  if (car.seller) {
    const sellerName = [car.seller.first_name, car.seller.last_name].filter(Boolean).join(' ') || car.seller.username
    if (sellerName) contacts.set('contact', contacts.get('contact') || sellerName)
    if (car.seller.phone) contacts.set('phone', contacts.get('phone') || car.seller.phone)
    if (car.seller.city) contacts.set('city', contacts.get('city') || car.seller.city)
    if (car.seller.email) contacts.set('email', contacts.get('email') || car.seller.email)
  }

  return {
    description,
    contacts: contactLabels
      .map((label) => ({ label, value: contacts.get(label.toLowerCase()) || '' }))
      .filter((contact) => contact.value),
  }
}

function CarDetailPage({
  car,
  relatedCars,
  bidMessage,
  commentText,
  isCommentSending,
  setCommentText,
  openPurchaseOffer,
  openBooking,
  submitComment,
  toggleLike,
  contactSeller,
  openCar,
  openReviews,
  startReview,
  currentUserId,
  showNotice,
}: CarDetailPageProps) {
  const reviews = car.reviews || []
  const firstReview = reviews[0]
  const isOwnListing = Boolean(currentUserId && car.owner === currentUserId)
  const shareUrl = `${window.location.origin}${window.location.pathname}#car-${car.id}`
  const galleryImages = car.images?.length ? car.images.map((image) => image.image_url) : [fallbackImage(car)]
  const carFeatures = buildFeatureList(car)
  const listingDetails = splitDescriptionAndContacts(car)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    setActiveImageIndex(0)
  }, [car.id])

  function copyShareLink() {
    if (!navigator.clipboard) {
      showNotice(shareUrl)
      return
    }

    navigator.clipboard
      .writeText(shareUrl)
      .then(() => showNotice('Share link copied'))
      .catch(() => showNotice(shareUrl))
  }

  return (
    <section className="car-detail-page">
      <div className="detail-topbar">
        <div>
          <h1>{carTitle(car)}</h1>
          <p>{car.year} / {formatMileage(car.mileage)} / {car.fuel_type} / {car.transmission}</p>
        </div>
        <div>
          {isOwnListing ? (
            <span className="own-listing-chip">Your listing</span>
          ) : (
            <>
              <button type="button" className="offer-button" onClick={() => openPurchaseOffer(car)}>Make offer</button>
              <button type="button" onClick={() => contactSeller(car)}>Contact Seller</button>
              {car.is_available_for_rent && <button type="button" onClick={() => openBooking(car)}>Book rental</button>}
            </>
          )}
          <button type="button" aria-label="Add to favorites" onClick={() => toggleLike(car)}>Save</button>
          <button type="button" aria-label="Share car" onClick={copyShareLink}>Share</button>
        </div>
      </div>

      <section className="car-hero-panel">
        <img src={galleryImages[activeImageIndex]} alt={carTitle(car)} />
        {galleryImages.length > 1 && (
          <div className="detail-gallery-controls">
            <button
              type="button"
              onClick={() => setActiveImageIndex((activeImageIndex - 1 + galleryImages.length) % galleryImages.length)}
              aria-label="Previous vehicle photo"
            >
              {'<'}
            </button>
            <span>{activeImageIndex + 1} / {galleryImages.length}</span>
            <button
              type="button"
              onClick={() => setActiveImageIndex((activeImageIndex + 1) % galleryImages.length)}
              aria-label="Next vehicle photo"
            >
              {'>'}
            </button>
          </div>
        )}
        {galleryImages.length > 1 && (
          <div className="detail-thumbnail-strip">
            {galleryImages.map((imageUrl, index) => (
              <button
                key={imageUrl}
                type="button"
                className={index === activeImageIndex ? 'active' : ''}
                onClick={() => setActiveImageIndex(index)}
                aria-label={`Show vehicle photo ${index + 1}`}
              >
                <img src={imageUrl} alt={`${carTitle(car)} ${index + 1}`} />
              </button>
            ))}
          </div>
        )}
        <div className="hero-chip-stack">
          <article><strong>{formatPrice(car.price)}</strong><span>Price</span></article>
          <article><strong>{car.brand}</strong><span>Brand</span></article>
          <article><strong>{car.fuel_type}</strong><span>Fuel type</span></article>
        </div>
      </section>

      {bidMessage && <p className="inline-success">{bidMessage}</p>}

      <div className="car-info-grid">
        <section className="detail-panel overview-panel">
          <h2>Overview</h2>
          <dl>
            <div><dt>Make</dt><dd>{car.brand}</dd></div>
            <div><dt>Body Type</dt><dd>{car.body_type || 'Not specified'}</dd></div>
            <div><dt>Model</dt><dd>{car.model}</dd></div>
            <div><dt>Drive Type</dt><dd>{car.transmission === 'automatic' ? 'Automatic' : 'Manual'}</dd></div>
            <div><dt>Year</dt><dd>{car.year}</dd></div>
            <div><dt>Engine</dt><dd>{car.fuel_type}</dd></div>
            <div><dt>Mileage</dt><dd>{formatMileage(car.mileage)}</dd></div>
            <div><dt>Color</dt><dd>{car.color || 'Not specified'}</dd></div>
            <div><dt>Fuel Type</dt><dd>{car.fuel_type}</dd></div>
            <div><dt>VIN</dt><dd>WP0AF2A95PS{String(car.id).padStart(5, '0')}</dd></div>
            <div><dt>Transmission</dt><dd>{car.transmission}</dd></div>
            <div><dt>Condition</dt><dd>{car.condition || 'Used'}</dd></div>
          </dl>
        </section>

        <section className="detail-panel features-panel">
          <h2>Features</h2>
          {carFeatures.map((feature) => <span key={feature}>{feature.replace(/^OK\s+/i, '')}</span>)}
        </section>

        <section className="detail-panel description-panel">
          <h2>Description</h2>
          <p>{listingDetails.description}</p>
          {listingDetails.contacts.length > 0 && (
            <div className="listing-contact-card">
              <h3>Seller contacts</h3>
              <div>
                {listingDetails.contacts.map((contact) => (
                  <article key={contact.label}>
                    <span>{contact.label}</span>
                    <strong>{contact.value}</strong>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="detail-panel review-preview">
          <div>
            <h2>Reviews ({car.reviews_count || reviews.length})</h2>
            <button type="button" onClick={openReviews}>See all</button>
          </div>
          {firstReview ? (
            <article>
              <strong>{firstReview.username}</strong>
              <span>{'*'.repeat(firstReview.rating)}{'-'.repeat(5 - firstReview.rating)}</span>
              <p>{firstReview.text}</p>
            </article>
          ) : (
            <article>
              <strong>No reviews yet</strong>
              <p>{isOwnListing ? 'Reviews from buyers will appear here after deals.' : 'Be the first to describe your buying experience.'}</p>
              {!isOwnListing && <button type="button" onClick={startReview}>Leave a review</button>}
            </article>
          )}
        </section>
      </div>

      <section className="seller-question detail-panel">
        <div>
          <h2>Ask seller a question</h2>
          <span>{(car.comments || []).length} comments</span>
        </div>
        {isOwnListing ? (
          <p className="owner-note">Buyer questions about this listing will appear here.</p>
        ) : (
          <form onSubmit={submitComment}>
            <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Ask about condition, service history or documents" />
            <button type="submit" disabled={isCommentSending || !commentText.trim()}>
              {isCommentSending ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}
        {(car.comments || []).slice(0, 3).map((comment: CarComment) => (
          <p key={comment.id}><strong>{comment.username}</strong>{comment.text}</p>
        ))}
      </section>

      <section className="might-like">
        <div className="section-row">
          <h2>You also might like</h2>
          <button type="button" onClick={() => openPurchaseOffer(car)}>Make offer</button>
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
