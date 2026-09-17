import type { CarReview } from '../types/cars'

type ReviewsPageProps = {
  reviews: CarReview[]
  isLoading: boolean
  startReview: () => void
  goHome: () => void
  showNotice: (message: string) => void
}

function ReviewsPage({ reviews, isLoading, startReview, goHome, showNotice }: ReviewsPageProps) {
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  return (
    <section className="reviews-page">
      <div className="reviews-heading">
        <h1>Reviews</h1>
        <p>See what our customers are saying about their experience.</p>
      </div>

      <section className="rating-summary">
        <div>
          <strong>{average.toFixed(1)}</strong>
          <span>****-</span>
          <p>Based on {reviews.length} reviews</p>
        </div>
        <div className="rating-bars">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter((review) => review.rating === rating).length
            return (
              <p key={rating}>
                <span>{rating} stars</span>
                <progress value={count} max={Math.max(reviews.length, 1)} />
                <b>{count}</b>
              </p>
            )
          })}
        </div>
        <article>
          <strong>Verified Reviews</strong>
          <p>All reviews are from real customers who used cars through our platform.</p>
        </article>
      </section>

      <button className="leave-review-button" type="button" onClick={startReview}>Leave a review +</button>
      {isLoading && <p className="soft-note">Loading reviews...</p>}
      {!isLoading && reviews.length === 0 && <p className="soft-note">No reviews yet. Customer reviews will appear after completed deals.</p>}

      <div className="review-list">
        {reviews.map((review) => (
          <article key={review.id} className="review-row">
            <div className="review-avatar">{review.username.slice(0, 1).toUpperCase()}</div>
            <div>
              <h2>{review.username}</h2>
              <p>Bought {review.car_title}</p>
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            <div className="review-text">
              <strong>{'*'.repeat(review.rating)}{'-'.repeat(5 - review.rating)}</strong>
              <p>{review.text}</p>
            </div>
            <img src={review.car_image_url} alt={review.car_title} />
            <button type="button" aria-label="Review menu" onClick={() => showNotice('Review actions opened')}>...</button>
          </article>
        ))}
      </div>
      <button className="secondary-button" type="button" onClick={goHome}>Continue browsing</button>
    </section>
  )
}

export default ReviewsPage
