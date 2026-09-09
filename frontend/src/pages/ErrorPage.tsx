type ErrorPageProps = {
  goHome: () => void
}

function ErrorPage({ goHome }: ErrorPageProps) {
  return (
    <section className="error-page">
      <div>
        <h1>404</h1>
        <p>Page not found</p>
        <span>The page you are looking for does not exist or has been moved.</span>
        <button type="button" onClick={goHome}>Go to main page</button>
      </div>
    </section>
  )
}

export default ErrorPage
