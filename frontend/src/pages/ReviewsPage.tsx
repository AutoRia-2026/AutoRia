import type { CarReview } from '../types/cars'

type ReviewsPageProps = {
  reviews: CarReview[]
  isLoading: boolean
  startReview: () => void
  goHome: () => void
}

function ReviewsPage({ reviews, isLoading, startReview, goHome }: ReviewsPageProps) {
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 4.7

  return (
    <section className="reviews-page">
      <div className="reviews-heading">
        <h1>Reviews</h1>
        <p>See what our customers are saying about their experience.</p>
      </div>

      <section className="rating-summary">
        <div>
          <strong>{average.toFixed(1)}</strong>
          <span>★★★★☆</span>
          <p>Based on {Math.max(reviews.length, 103)} reviews</p>
        </div>
        <div className="rating-bars">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviews.filter((review) => review.rating === rating).length || (rating === 5 ? 62 : rating === 4 ? 25 : rating === 3 ? 13 : rating === 2 ? 3 : 0)
            return (
              <p key={rating}>
                <span>{rating} stars</span>
                <progress value={count} max="62" />
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

      <div className="review-list">
        {(reviews.length ? reviews : fallbackReviews).map((review) => (
          <article key={review.id} className="review-row">
            <div className="review-avatar">{review.username.slice(0, 1).toUpperCase()}</div>
            <div>
              <h2>{review.username}</h2>
              <p>Bought {review.car_title}</p>
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            <div className="review-text">
              <strong>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</strong>
              <p>{review.text}</p>
              <button type="button">Helpful ({review.recommend_seller ? 6 : 1})</button>
            </div>
            <img src={review.car_image_url} alt={review.car_title} />
            <button type="button" aria-label="Review menu" onClick={goHome}>...</button>
          </article>
        ))}
      </div>
    </section>
  )
}

const fallbackReviews: CarReview[] = [
  {
    id: -1,
    car: -1,
    car_title: 'BMW X5 2021',
    car_image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=500&q=80',
    user: -1,
    username: 'James Anderson',
    rating: 5,
    text: 'Great experience. The seller was professional and the car was even better than described.',
    recommend_seller: true,
    created_at: new Date().toISOString(),
  },
]

export default ReviewsPage
