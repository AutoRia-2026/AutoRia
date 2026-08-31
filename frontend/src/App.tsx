import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'autoria_token'

type AuthScreen =
  | 'login'
  | 'signup-info'
  | 'signup-password'
  | 'signup-code'
  | 'forgot'
  | 'reset-code'
  | 'reset-password'
  | 'check-email'

type User = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

type AuthResponse = {
  token: string
  user: User
}

type Car = {
  id: number
  owner: number | null
  brand: string
  model: string
  year: number
  mileage: number
  price: string
  transmission: string
  fuel_type: string
  image_url: string
  description: string
  likes_count: number
  created_at: string
}

type CarsResponse = {
  count: number
  next: string | null
  previous: string | null
  results: Car[]
}

type ApiError = Record<string, string[] | string>

const featuredImages = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80',
]

function parseApiError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return 'Request failed'
  }

  const data = error as ApiError

  if (data.non_field_errors) {
    return Array.isArray(data.non_field_errors)
      ? data.non_field_errors.join(' ')
      : data.non_field_errors
  }

  const key = Object.keys(data)[0]
  const value = data[key]

  if (Array.isArray(value)) {
    return value.join(' ')
  }

  return value || 'Check entered data'
}

async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = response.status === 204 ? null : await response.json()

  if (!response.ok) {
    throw data
  }

  return data
}

function formatPrice(price: string) {
  return `$${Math.round(Number(price)).toLocaleString('en-US')}`
}

function formatMileage(mileage: number) {
  return `${mileage.toLocaleString('en-US')} mi`
}

function App() {
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login')
  const [authOpen, setAuthOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [cars, setCars] = useState<Car[]>([])
  const [carsCount, setCarsCount] = useState(0)
  const [nextPage, setNextPage] = useState<string | null>(null)
  const [previousPage, setPreviousPage] = useState<string | null>(null)
  const [carsError, setCarsError] = useState('')
  const [isCarsLoading, setIsCarsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [pageUrl, setPageUrl] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  const brands = useMemo(
    () => Array.from(new Set(cars.map((car) => car.brand))).sort(),
    [cars],
  )

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    apiRequest('/auth/me/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then((data) => setUser(data as User))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken('')
        setUser(null)
      })
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams()

    if (search.trim()) {
      params.set('search', search.trim())
    }

    if (brand) {
      params.set('brand', brand)
    }

    if (fuelType) {
      params.set('fuel_type', fuelType)
    }

    if (ordering) {
      params.set('ordering', ordering)
    }

    const url = pageUrl || `${API_URL}/cars/?${params.toString()}`

    setIsCarsLoading(true)
    setCarsError('')

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw await response.json()
        }

        return response.json()
      })
      .then((data: CarsResponse) => {
        setCars(data.results)
        setCarsCount(data.count)
        setNextPage(data.next)
        setPreviousPage(data.previous)
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setCarsError('Cars could not be loaded')
        }
      })
      .finally(() => setIsCarsLoading(false))

    return () => controller.abort()
  }, [brand, fuelType, ordering, pageUrl, refreshIndex, search])

  function updateSearch(value: string) {
    setSearch(value)
    setPageUrl(null)
  }

  function updateBrand(value: string) {
    setBrand(value)
    setPageUrl(null)
  }

  function updateFuel(value: string) {
    setFuelType(value)
    setPageUrl(null)
  }

  function updateOrdering(value: string) {
    setOrdering(value)
    setPageUrl(null)
  }

  function changeAuthScreen(nextScreen: AuthScreen) {
    setAuthScreen(nextScreen)
    setError('')
    setMessage('')
  }

  function openAuth(screen: AuthScreen = 'login') {
    setAuthOpen(true)
    changeAuthScreen(screen)
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsAuthLoading(true)

    try {
      const data = (await apiRequest('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })) as AuthResponse

      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setUser(data.user)
      setPassword('')
      setAuthOpen(false)
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsAuthLoading(false)
    }
  }

  function submitSignupInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    changeAuthScreen('signup-password')
  }

  async function submitSignupPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsAuthLoading(true)

    try {
      await apiRequest('/auth/register/', {
        method: 'POST',
        body: JSON.stringify({
          email,
          username: email.split('@')[0],
          first_name: name,
          password,
        }),
      })

      setPassword('')
      setConfirmPassword('')
      changeAuthScreen('signup-code')
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsAuthLoading(false)
    }
  }

  async function submitSignupCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsAuthLoading(true)

    try {
      await apiRequest('/auth/verify-email/', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      })

      setCode('')
      setPassword('')
      setConfirmPassword('')
      setAuthScreen('login')
      setMessage('Account created. Please sign in.')
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsAuthLoading(false)
    }
  }

  async function submitForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsAuthLoading(true)

    try {
      await apiRequest('/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      changeAuthScreen('check-email')
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsAuthLoading(false)
    }
  }

  function submitResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    changeAuthScreen('reset-password')
  }

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsAuthLoading(true)

    try {
      await apiRequest('/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ email, code, password }),
      })

      setPassword('')
      setConfirmPassword('')
      setCode('')
      setAuthScreen('login')
      setMessage('Password changed. Please sign in.')
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsAuthLoading(false)
    }
  }

  async function logout() {
    if (token) {
      await apiRequest('/auth/logout/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
      }).catch(() => undefined)
    }

    localStorage.removeItem(TOKEN_KEY)
    setToken('')
    setUser(null)
  }

  async function toggleLike(car: Car) {
    if (!token) {
      openAuth('login')
      return
    }

    try {
      const response = await fetch(`${API_URL}/cars/${car.id}/like/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
      })

      if (response.status === 400) {
        await fetch(`${API_URL}/cars/${car.id}/like/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Token ${token}`,
          },
        })
      }

      setRefreshIndex((currentValue) => currentValue + 1)
    } finally {
      setIsCarsLoading(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="logo" href="/" aria-label="VEYO home">
          veyo
        </a>

        <nav className="top-nav" aria-label="Primary navigation">
          <a href="#auctions">Auctions</a>
          <a href="#sell">Sell your car</a>
          <a href="#about">What's VEYO?</a>
          <a href="#leaderboard">Leaderboard</a>
        </nav>

        <label className="header-search">
          <span>Search</span>
          <input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search for car or model"
          />
        </label>

        <div className="header-actions">
          <button type="button" aria-label="Notifications">
            !
          </button>
          {user ? (
            <button type="button" onClick={logout}>
              {user.first_name || user.username}
            </button>
          ) : (
            <button type="button" onClick={() => openAuth('login')}>
              Sign in
            </button>
          )}
          <button type="button">EN</button>
        </div>
      </header>

      <section className="featured-grid" aria-label="Featured cars">
        <article className="featured-card featured-large">
          <img src={featuredImages[0]} alt="Porsche Panamera" />
          <div>
            <h1>2020 Porsche Panamera 4</h1>
            <span>Online auction</span>
          </div>
        </article>
        <article className="featured-card">
          <img src={featuredImages[1]} alt="Featured car" />
          <div>
            <h2>Featured cars</h2>
            <span>Top bids</span>
          </div>
        </article>
        <article className="featured-card">
          <img src={featuredImages[2]} alt="Newly added car" />
          <div>
            <h2>Newly added</h2>
            <span>Fresh stock</span>
          </div>
        </article>
        <article className="featured-card featured-wide">
          <img src={featuredImages[3]} alt="Ford Galaxie" />
          <div>
            <h2>1964 Ford Galaxie 500 Convertible</h2>
            <span>Classic collection</span>
          </div>
        </article>
      </section>

      <section className="auction-section" id="auctions">
        <div className="section-bar">
          <h2>Auctions</h2>
          <div className="filters">
            <button type="button" className="filter-chip active">
              Ending soon
            </button>
            <button type="button" className="filter-chip">
              New cars
            </button>
            <button type="button" className="filter-chip">
              Inspected
            </button>
            <select value={brand} onChange={(event) => updateBrand(event.target.value)}>
              <option value="">All brands</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select value={fuelType} onChange={(event) => updateFuel(event.target.value)}>
              <option value="">Fuel</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
              <option value="gas">Gas</option>
            </select>
            <select value={ordering} onChange={(event) => updateOrdering(event.target.value)}>
              <option value="-created_at">Newest</option>
              <option value="price">Price low</option>
              <option value="-price">Price high</option>
              <option value="-year">Year new</option>
              <option value="year">Year old</option>
            </select>
          </div>
        </div>

        {carsError && <p className="cars-error">{carsError}</p>}

        <div className="cars-grid">
          {cars.map((car) => (
            <article className="car-card" key={car.id}>
              <div className="car-media">
                <img
                  src={car.image_url || featuredImages[car.id % featuredImages.length]}
                  alt={`${car.year} ${car.brand} ${car.model}`}
                />
                <button type="button" className="lot-badge">
                  #{String(car.id).padStart(5, '0')}
                </button>
                <button type="button" className="price-badge" onClick={() => toggleLike(car)}>
                  {car.likes_count} {formatPrice(car.price)}
                </button>
              </div>
              <div className="car-body">
                <h3>
                  {car.year} {car.brand} {car.model}
                </h3>
                <p>{car.description || 'Verified listing, ready for auction.'}</p>
                <div className="tag-row">
                  <span>{car.fuel_type}</span>
                  <span>{car.transmission}</span>
                  <span>{formatMileage(car.mileage)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="pagination-bar">
          <span>{isCarsLoading ? 'Loading cars...' : `${carsCount} cars available`}</span>
          <div>
            <button type="button" disabled={!previousPage} onClick={() => setPageUrl(previousPage)}>
              Previous
            </button>
            <button type="button" disabled={!nextPage} onClick={() => setPageUrl(nextPage)}>
              Next
            </button>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <a className="logo" href="/">
          veyo
        </a>
        <div>
          <h4>How it works</h4>
          <a href="#auctions">Auctions</a>
          <a href="#sell">Sell your car</a>
          <a href="#inspection">Inspection</a>
        </div>
        <div>
          <h4>Sellers</h4>
          <a href="#conditions">Condition</a>
          <a href="#pricing">Pricing</a>
          <a href="#support">Support</a>
        </div>
        <div>
          <h4>Helpful links</h4>
          <a href="#about">What's VEYO?</a>
          <a href="#terms">Terms</a>
          <a href="#privacy">Privacy</a>
        </div>
      </footer>

      {authOpen && (
        <div className="auth-overlay">
          <section className="auth-card">
            {authScreen !== 'login' && (
              <button
                className="icon-button back-button"
                type="button"
                aria-label="Back"
                onClick={() => changeAuthScreen(authScreen.startsWith('signup') ? 'signup-info' : 'login')}
              >
                &lsaquo;
              </button>
            )}

            <button
              className="icon-button close-button"
              type="button"
              aria-label="Close"
              onClick={() => setAuthOpen(false)}
            >
              &times;
            </button>

            {authScreen === 'login' && (
              <form className="auth-content" onSubmit={submitLogin}>
                <h1>Welcome back</h1>

                <label>
                  Enter your email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="example@yourmail.com"
                    required
                  />
                </label>

                <label>
                  Enter your password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="example_password"
                    required
                  />
                </label>

                <div className="form-row">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    Remember me
                  </label>
                  <button className="link-button" type="button" onClick={() => changeAuthScreen('forgot')}>
                    Forgot password?
                  </button>
                </div>

                {message && <p className="form-success">{message}</p>}
                {error && <p className="form-error">{error}</p>}

                <button className="primary-button" type="submit" disabled={isAuthLoading}>
                  {isAuthLoading ? 'Loading...' : 'Continue'}
                </button>

                <div className="divider">
                  <span>or</span>
                </div>

                <div className="social-row">
                  <button type="button">G</button>
                  <button type="button">A</button>
                  <button type="button">f</button>
                </div>

                <p className="switch-copy">
                  Don't have an account?
                  <button type="button" onClick={() => changeAuthScreen('signup-info')}>
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {authScreen === 'signup-info' && (
              <form className="auth-content" onSubmit={submitSignupInfo}>
                <h1>Sign Up</h1>

                <label>
                  Enter your email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="example@yourmail.com"
                    required
                  />
                </label>

                <label>
                  Enter your name
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="example Name"
                    required
                  />
                </label>

                <button className="primary-button" type="submit">
                  Continue
                </button>

                <div className="divider">
                  <span>or</span>
                </div>

                <div className="social-row">
                  <button type="button">G</button>
                  <button type="button">A</button>
                  <button type="button">f</button>
                </div>

                <p className="switch-copy">
                  Already have an account?
                  <button type="button" onClick={() => changeAuthScreen('login')}>
                    Sign in here
                  </button>
                </p>
              </form>
            )}

            {authScreen === 'signup-password' && (
              <form className="auth-content" onSubmit={submitSignupPassword}>
                <h1>Sign Up</h1>

                <label>
                  Create your password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="example_password"
                    required
                  />
                </label>

                <label>
                  Confirm password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="example_password"
                    required
                  />
                </label>

                {error && <p className="form-error">{error}</p>}

                <button className="primary-button" type="submit" disabled={isAuthLoading}>
                  {isAuthLoading ? 'Loading...' : 'Create account'}
                </button>

                <p className="switch-copy">
                  Already have an account?
                  <button type="button" onClick={() => changeAuthScreen('login')}>
                    Sign in here
                  </button>
                </p>
              </form>
            )}

            {authScreen === 'signup-code' && (
              <form className="auth-content compact-content" onSubmit={submitSignupCode}>
                <h1>Check your email</h1>
                <p className="modal-copy">We sent a verification code to your email.</p>
                <label>
                  Enter code
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="123456"
                    required
                  />
                </label>
                {error && <p className="form-error">{error}</p>}
                <button className="primary-button" type="submit" disabled={isAuthLoading}>
                  {isAuthLoading ? 'Loading...' : 'Verify account'}
                </button>
              </form>
            )}

            {authScreen === 'forgot' && (
              <form className="auth-content compact-content" onSubmit={submitForgot}>
                <h1>Forgot Password?</h1>
                <p className="modal-copy">Enter your email and we will send you a verification code.</p>
                <label>
                  Enter your email
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="example@yourmail.com"
                    required
                  />
                </label>
                {error && <p className="form-error">{error}</p>}
                <button className="primary-button" type="submit" disabled={isAuthLoading}>
                  {isAuthLoading ? 'Loading...' : 'Send email'}
                </button>
              </form>
            )}

            {authScreen === 'check-email' && (
              <div className="auth-content compact-content">
                <h1>Check your email</h1>
                <p className="modal-copy">We have sent the password reset code to your email.</p>
                <button className="primary-button" type="button" onClick={() => changeAuthScreen('reset-code')}>
                  Continue
                </button>
              </div>
            )}

            {authScreen === 'reset-code' && (
              <form className="auth-content compact-content" onSubmit={submitResetCode}>
                <h1>Enter code</h1>
                <label>
                  Verification code
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="123456"
                    required
                  />
                </label>
                <button className="primary-button" type="submit">
                  Continue
                </button>
              </form>
            )}

            {authScreen === 'reset-password' && (
              <form className="auth-content" onSubmit={submitResetPassword}>
                <h1>Create new password</h1>
                <label>
                  Create new password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="example_password"
                    required
                  />
                </label>
                <label>
                  Confirm password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="example_password"
                    required
                  />
                </label>
                {error && <p className="form-error">{error}</p>}
                <button className="primary-button" type="submit" disabled={isAuthLoading}>
                  {isAuthLoading ? 'Loading...' : 'Reset password'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default App
