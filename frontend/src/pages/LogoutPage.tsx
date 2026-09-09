type LogoutPageProps = {
  logout: () => void
  stayLoggedIn: () => void
}

function LogoutPage({ logout, stayLoggedIn }: LogoutPageProps) {
  return (
    <section className="logout-page">
      <div>
        <h1>Log Out</h1>
        <p>Are you sure you want to log out of your account?</p>
        <button type="button" onClick={logout}>Log Out</button>
        <button type="button" onClick={stayLoggedIn}>Stay Logged In</button>
      </div>
    </section>
  )
}

export default LogoutPage
