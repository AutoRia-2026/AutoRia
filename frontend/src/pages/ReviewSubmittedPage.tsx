type ReviewSubmittedPageProps = {
  openReviews: () => void
  goHome: () => void
}

function ReviewSubmittedPage({ openReviews, goHome }: ReviewSubmittedPageProps) {
  return (
    <section className="review-submitted-page">
      <div>
        <h1>Review Submitted!</h1>
        <p>Thank you for sharing your experience</p>
        <button type="button" onClick={openReviews}>Back to Reviews</button>
        <button type="button" onClick={goHome}>Continue Browsing</button>
      </div>
    </section>
  )
}

export default ReviewSubmittedPage
