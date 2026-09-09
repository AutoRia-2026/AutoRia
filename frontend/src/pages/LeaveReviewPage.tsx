import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Car } from '../types/cars'
import { carTitle, fallbackImage, formatPrice } from '../utils/cars'

type LeaveReviewPageProps = {
  car: Car | null
  rating: number
  reviewText: string
  recommendSeller: boolean
  isSending: boolean
  setRating: (value: number) => void
  setReviewText: (value: string) => void
  setRecommendSeller: (value: boolean) => void
  submitReview: (event: FormEvent<HTMLFormElement>) => void
  cancel: () => void
}

function LeaveReviewPage({
  car,
  rating,
  reviewText,
  recommendSeller,
  isSending,
  setRating,
  setReviewText,
  setRecommendSeller,
  submitReview,
  cancel,
}: LeaveReviewPageProps) {
  const [photos, setPhotos] = useState<string[]>([])

  function addPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPhotos((currentPhotos) => [...currentPhotos, String(reader.result)].slice(0, 5))
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="leave-review-page">
      <div className="reviews-heading">
        <h1>Leave a review</h1>
        <p>Share your experience and help other buyers make the right choice.</p>
      </div>

      <form onSubmit={submitReview}>
        <div className="review-form-top">
          <article className="review-car-summary">
            {car && <img src={fallbackImage(car)} alt={carTitle(car)} />}
            <div>
              <h2>{car ? carTitle(car) : 'Choose a car'}</h2>
              <p>Seller: {car?.seller?.first_name || car?.seller?.username || 'Drive Hub seller'}</p>
              <span>{car ? formatPrice(car.price) : 'Marketplace purchase'}</span>
            </div>
          </article>

          <article className="rating-picker">
            <h2>Overall rating</h2>
            <div>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={star <= rating ? 'active' : ''}
                  onClick={() => setRating(star)}
                  aria-label={`${star} stars`}
                >
                  *
                </button>
              ))}
            </div>
            <p>Tap a star to rate your experience.</p>
          </article>
        </div>

        <label className="review-textarea">
          Your Review
          <textarea
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value.slice(0, 1000))}
            placeholder="Tell us about your experience with the seller, the vehicle, and the buying process."
            required
          />
          <span>{reviewText.length}/1000</span>
        </label>

        <section className="recommend-box">
          <h2>Would you recommend this seller?</h2>
          <label><input type="radio" checked={recommendSeller} onChange={() => setRecommendSeller(true)} /> Yes</label>
          <label><input type="radio" checked={!recommendSeller} onChange={() => setRecommendSeller(false)} /> No</label>
        </section>

        <section className="upload-box">
          <h2>Upload Photos (optional)</h2>
          <div>
            {[0, 1, 2, 3, 4].map((item) => (
              <label key={item} className={photos[item] ? 'filled' : ''}>
                {photos[item] ? <img src={photos[item]} alt={`Review upload ${item + 1}`} /> : '+'}
                <input type="file" accept="image/*" onChange={addPhoto} disabled={photos.length >= 5 && !photos[item]} />
              </label>
            ))}
          </div>
        </section>

        <div className="review-form-actions">
          <button type="button" onClick={cancel}>Cancel</button>
          <button type="submit" disabled={isSending || !car || rating === 0 || !reviewText.trim()}>
            {isSending ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default LeaveReviewPage
