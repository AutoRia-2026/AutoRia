import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'autoria_token'
const REMEMBER_KEY = 'autoria_remember'

type Page = 'auth' | 'home' | 'search' | 'detail' | 'profile'
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
  seller_profile?: {
    phone: string
    city: string
  } | null
}

type AuthResponse = {
  token: string
  user: User
}

type Car = {
  id: number
  owner: number | null
  seller?: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    phone: string
    city: string
  } | null
  brand: string
  model: string
  year: number
  mileage: number
  price: string
  transmission: string
  fuel_type: string
  image_url: string
  description: string
  status: string
  views_count: number
  likes_count: number
  images?: CarImage[]
  comments?: CarComment[]
  created_at: string
}

type CarImage = {
  id: number
  image_url: string
  position: number
  created_at: string
}

type CarComment = {
  id: number
  user: number
  username: string
  text: string
  created_at: string
}

type CarsResponse = {
  count: number
  next: string | null
  previous: string | null
  results: Car[]
}

type ApiError = Record<string, string[] | string>

const heroImages = [
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
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

function carTitle(car: Car) {
  return `${car.year} ${car.brand} ${car.model}`
}

function fallbackImage(car: Car) {
  return car.image_url || heroImages[car.id % heroImages.length]
}

function App() {
  const rememberedToken =
    localStorage.getItem(REMEMBER_KEY) === 'true' ? localStorage.getItem(TOKEN_KEY) || '' : ''
  const [page, setPage] = useState<Page>(rememberedToken ? 'home' : 'auth')
  const [selectedCar, setSelectedCar] = useState<Car | null>(null)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login')
  const [authOpen, setAuthOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [rememberMe, setRememberMe] = useState(localStorage.getItem(REMEMBER_KEY) === 'true')
  const [token, setToken] = useState(rememberedToken)
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
  const [activeFilter, setActiveFilter] = useState('ending')
  const [pageUrl, setPageUrl] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [notice, setNotice] = useState('')
  const [bidOpen, setBidOpen] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [bidMessage, setBidMessage] = useState('')
  const [commentText, setCommentText] = useState('')
  const [isCommentSending, setIsCommentSending] = useState(false)
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
  })
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isProfileSaving, setIsProfileSaving] = useState(false)

  const brands = useMemo(
    () => Array.from(new Set(cars.map((car) => car.brand))).sort(),
    [cars],
  )
  const relatedCars = useMemo(
    () => cars.filter((car) => car.id !== selectedCar?.id).slice(0, 6),
    [cars, selectedCar],
  )
  const searchHeading = search.trim() || brand || 'Cars'
  const visibleCars = useMemo(() => {
    if (activeFilter === 'watched') {
      return [...cars].sort((firstCar, secondCar) => secondCar.likes_count - firstCar.likes_count)
    }

    return cars
  }, [activeFilter, cars])

  useEffect(() => {
    if (localStorage.getItem(REMEMBER_KEY) !== 'true') {
      localStorage.removeItem(TOKEN_KEY)
    }

    if (!token) {
      setUser(null)
      setPage('auth')
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
        localStorage.removeItem(REMEMBER_KEY)
        setToken('')
        setUser(null)
        setPage('auth')
      })
  }, [token])

  useEffect(() => {
    if (!user) {
      return
    }

    setProfileForm({
      username: user.username || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.seller_profile?.phone || '',
      city: user.seller_profile?.city || '',
    })
  }, [user])

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
    setPage(value.trim() ? 'search' : 'home')
    setNotice('')
  }

  function updateBrand(value: string) {
    setBrand(value)
    setPageUrl(null)
    setPage(value ? 'search' : page)
    setNotice('')
  }

  function updateFuel(value: string) {
    setFuelType(value)
    setPageUrl(null)
    setPage('search')
    setNotice('')
  }

  function updateOrdering(value: string) {
    setOrdering(value)
    setPageUrl(null)
    setPage('search')
    setNotice('')
  }

  function goHome() {
    setPage('home')
    setSearch('')
    setBrand('')
    setFuelType('')
    setOrdering('-created_at')
    setActiveFilter('ending')
    setPageUrl(null)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showNotice(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 2800)
  }

  function applyQuickFilter(filter: string) {
    setActiveFilter(filter)
    setPageUrl(null)
    setPage('search')

    if (filter === 'ending') {
      setOrdering('-created_at')
    }

    if (filter === 'new') {
      setOrdering('-year')
    }

    if (filter === 'watched') {
      showNotice('Showing cars with the most watchers first')
    }
  }

  function saveSearch() {
    localStorage.setItem(
      'autoria_saved_search',
      JSON.stringify({ search, brand, fuelType, ordering, activeFilter }),
    )
    showNotice('Search saved')
  }

  function openProtectedPage(nextPage: Page, fallbackMessage = 'Please sign in first') {
    if (!token) {
      openAuth('login')
      return
    }

    setPage(nextPage)
    if (fallbackMessage) {
      showNotice(fallbackMessage)
    }
  }

  async function openCar(car: Car) {
    setPage('detail')
    setBidMessage('')
    setBidAmount('')
    setCommentText('')
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      const data = (await apiRequest(`/cars/${car.id}/`)) as Car
      setSelectedCar(data)
    } catch {
      setSelectedCar(car)
    }
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

      if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, data.token)
        localStorage.setItem(REMEMBER_KEY, 'true')
      } else {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REMEMBER_KEY)
      }
      setToken(data.token)
      setUser(data.user)
      setPassword('')
      setAuthOpen(false)
      setPage('home')
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
    localStorage.removeItem(REMEMBER_KEY)
    setToken('')
    setUser(null)
    setRememberMe(false)
    setPage('auth')
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setPage('auth')
      return
    }

    setProfileMessage('')
    setProfileError('')
    setIsProfileSaving(true)

    try {
      const data = (await apiRequest('/auth/me/', {
        method: 'PATCH',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(profileForm),
      })) as User

      setUser(data)
      setProfileMessage('Profile updated')
    } catch (requestError) {
      setProfileError(parseApiError(requestError))
    } finally {
      setIsProfileSaving(false)
    }
  }

  async function toggleLike(car: Car) {
    if (!token) {
      openAuth('login')
      return
    }

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

    if (selectedCar?.id === car.id) {
      const data = (await apiRequest(`/cars/${car.id}/`)) as Car
      setSelectedCar(data)
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      openAuth('login')
      return
    }

    if (!selectedCar || !commentText.trim()) {
      return
    }

    setIsCommentSending(true)

    try {
      const comment = (await apiRequest(`/cars/${selectedCar.id}/comments/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ text: commentText.trim() }),
      })) as CarComment

      setSelectedCar({
        ...selectedCar,
        comments: [comment, ...(selectedCar.comments || [])],
      })
      setCommentText('')
    } catch (requestError) {
      showNotice(parseApiError(requestError))
    } finally {
      setIsCommentSending(false)
    }
  }

  function submitBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setBidOpen(false)
      openAuth('login')
      return
    }

    if (!selectedCar) {
      return
    }

    const numericBid = Number(bidAmount)

    if (!Number.isFinite(numericBid) || numericBid <= Number(selectedCar.price)) {
      setBidMessage(`Bid must be higher than ${formatPrice(selectedCar.price)}`)
      setBidOpen(false)
      return
    }

    setBidOpen(false)
    setBidMessage(`Bid ${formatPrice(bidAmount)} submitted`)
    setBidAmount('')
  }

  function renderCarCard(car: Car, compact = false) {
    return (
      <article className={compact ? 'car-card compact-card' : 'car-card'} key={car.id}>
        <div className="car-media">
          <button className="media-button" type="button" onClick={() => openCar(car)}>
            <img src={fallbackImage(car)} alt={carTitle(car)} />
          </button>
          <span className="lot-badge">#{String(car.id).padStart(5, '0')}</span>
          <button
            className="price-badge"
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              toggleLike(car)
            }}
          >
            {formatPrice(car.price)}
          </button>
        </div>
        <div className="car-body">
          <button type="button" className="car-title-button" onClick={() => openCar(car)}>
            {carTitle(car)}
          </button>
          <p>{car.description || 'Verified listing, ready for auction.'}</p>
          <div className="tag-row">
            <span>{car.fuel_type}</span>
            <span>{car.transmission}</span>
            <span>{formatMileage(car.mileage)}</span>
          </div>
        </div>
      </article>
    )
  }

  function renderFooter() {
    return (
      <footer className="site-footer">
        <button className="logo footer-logo" type="button" onClick={goHome}>
          veyo
        </button>
        <div>
          <h4>How it works</h4>
          <button type="button" onClick={() => showNotice('SafePay page will be added later')}>SafePay</button>
          <button type="button" onClick={() => showNotice('Buying guide will be added later')}>Buying a Car</button>
          <button type="button" onClick={() => showNotice('Sale guide will be added later')}>Finalizing the Sale</button>
        </div>
        <div>
          <h4>Sellers</h4>
          <button type="button" onClick={() => openProtectedPage('profile', 'Car submission page will be added later')}>Submit Your Car</button>
          <button type="button" onClick={() => openProtectedPage('profile', 'Seller dashboard will be added later')}>Dashboard</button>
          <button type="button" onClick={() => showNotice('Photo guide will be added later')}>Photo Guide</button>
        </div>
        <div>
          <h4>Helpful links</h4>
          <button type="button" onClick={() => showNotice('VEYO information page will be added later')}>What's VEYO?</button>
          <button type="button" onClick={() => showNotice('Terms page will be added later')}>Terms</button>
          <button type="button" onClick={() => showNotice('Privacy page will be added later')}>Privacy</button>
        </div>
      </footer>
    )
  }

  function renderAuthCard(showCloseButton = true) {
    return (
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
          {showCloseButton && (
            <button
              className="icon-button close-button"
              type="button"
              aria-label="Close"
              onClick={() => setAuthOpen(false)}
            >
              &times;
            </button>
          )}

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
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
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
                <button type="button" onClick={() => setError('Google login will be added later')}>G</button>
                <button type="button" onClick={() => setError('Apple login will be added later')}>A</button>
                <button type="button" onClick={() => setError('Facebook login will be added later')}>f</button>
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
                <button type="button" onClick={() => setError('Google registration will be added later')}>G</button>
                <button type="button" onClick={() => setError('Apple registration will be added later')}>A</button>
                <button type="button" onClick={() => setError('Facebook registration will be added later')}>f</button>
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
    )
  }

  function renderAuthModal() {
    if (!authOpen) {
      return null
    }

    return (
      <div className="auth-overlay">
        {renderAuthCard()}
      </div>
    )
  }

  function renderBidModal() {
    if (!bidOpen || !selectedCar) {
      return null
    }

    return (
      <div className="auth-overlay">
        <section className="auth-card bid-card">
          <button
            className="icon-button close-button"
            type="button"
            aria-label="Close"
            onClick={() => setBidOpen(false)}
          >
            &times;
          </button>
          <form className="auth-content compact-content" onSubmit={submitBid}>
            <h1>{carTitle(selectedCar)}</h1>
            <p className="modal-copy">Current price: {formatPrice(selectedCar.price)}</p>
            <label>
              Your bid
              <input
                type="text"
                inputMode="numeric"
                value={bidAmount}
                onChange={(event) => setBidAmount(event.target.value)}
                placeholder="25000"
                required
              />
            </label>
            <button className="primary-button" type="submit">Make a bid</button>
          </form>
        </section>
      </div>
    )
  }

  function renderProfilePage() {
    if (!user) {
      return null
    }

    return (
      <section className="profile-page">
        <div className="profile-header">
          <div>
            <span>Account</span>
            <h1>{user.first_name || user.username}</h1>
          </div>
          <button type="button" onClick={logout}>Log out</button>
        </div>

        <form className="profile-panel" onSubmit={submitProfile}>
          <div className="profile-section-title">
            <h2>Profile settings</h2>
            <p>Seller information is used on car pages and contacts.</p>
          </div>

          <div className="profile-grid">
            <label>
              Username
              <input
                type="text"
                value={profileForm.username}
                onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                required
              />
            </label>
            <label>
              First name
              <input
                type="text"
                value={profileForm.first_name}
                onChange={(event) => setProfileForm({ ...profileForm, first_name: event.target.value })}
              />
            </label>
            <label>
              Last name
              <input
                type="text"
                value={profileForm.last_name}
                onChange={(event) => setProfileForm({ ...profileForm, last_name: event.target.value })}
              />
            </label>
            <label>
              Phone
              <input
                type="text"
                value={profileForm.phone}
                onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                placeholder="+380..."
              />
            </label>
            <label>
              City
              <input
                type="text"
                value={profileForm.city}
                onChange={(event) => setProfileForm({ ...profileForm, city: event.target.value })}
                placeholder="Kyiv"
              />
            </label>
          </div>

          {profileMessage && <p className="form-success">{profileMessage}</p>}
          {profileError && <p className="form-error">{profileError}</p>}

          <div className="profile-actions">
            <button className="primary-button" type="submit" disabled={isProfileSaving}>
              {isProfileSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    )
  }

  if (page === 'auth' && !user) {
    return <main className="auth-page-shell">{renderAuthCard(false)}</main>
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <button className="logo" type="button" onClick={goHome}>
          veyo
        </button>
        <nav className="top-nav" aria-label="Primary navigation">
          <button type="button" onClick={goHome}>Auctions</button>
          <button type="button" onClick={() => openProtectedPage('profile', 'Car submission page will be added later')}>Sell your car</button>
          <button type="button" onClick={() => showNotice('VEYO information page will be added later')}>What's VEYO?</button>
          <button type="button" onClick={() => applyQuickFilter('watched')}>Leaderboard</button>
        </nav>
        <label className="header-search">
          <span>Search</span>
          <input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            onFocus={() => setPage('search')}
            placeholder="Search for car or model"
          />
        </label>
        <div className="header-actions">
          <button type="button" aria-label="Notifications" onClick={() => showNotice('No new notifications')}>!</button>
          {user ? (
            <button type="button" onClick={() => setPage('profile')}>{user.first_name || user.username}</button>
          ) : (
            <button type="button" onClick={() => openAuth('login')}>Sign in</button>
          )}
          <button type="button" onClick={() => showNotice('English interface is active')}>EN</button>
        </div>
      </header>
      {notice && <div className="toast-message">{notice}</div>}

      {page === 'profile' && user ? (
        renderProfilePage()
      ) : page === 'detail' && selectedCar ? (
        <section className="detail-page">
          <div className="detail-title">
            <button type="button" onClick={() => setPage(search || brand ? 'search' : 'home')}>Auctions</button>
            <h1>{carTitle(selectedCar)}</h1>
            <p>{formatMileage(selectedCar.mileage)} · {selectedCar.fuel_type} · {selectedCar.transmission}</p>
          </div>

          <section className="detail-hero">
            <img src={fallbackImage(selectedCar)} alt={carTitle(selectedCar)} />
            <div className="stats-stack">
              <span><strong>{selectedCar.likes_count}</strong>Watching</span>
              <span><strong>{selectedCar.views_count}</strong>Views</span>
              <span><strong>3</strong>Bids count</span>
            </div>
            <p className="hero-note">{selectedCar.description || 'Clean title, verified history and auction-ready listing.'}</p>
            <button className="bid-button" type="button" onClick={() => token ? setBidOpen(true) : openAuth('login')}>Place Bid</button>
          </section>
          {bidMessage && <p className="inline-success">{bidMessage}</p>}

          <div className="detail-layout">
            <section>
              <div className="spec-grid">
                <dl>
                  <div><dt>Brand</dt><dd>{selectedCar.brand}</dd></div>
                  <div><dt>Model</dt><dd>{selectedCar.model}</dd></div>
                  <div><dt>Mileage</dt><dd>{formatMileage(selectedCar.mileage)}</dd></div>
                  <div><dt>VIN</dt><dd>WBS43AZ0X0{selectedCar.id}975</dd></div>
                  <div><dt>Title Status</dt><dd>Clean</dd></div>
                  <div><dt>Location</dt><dd>Portland, OR 97205</dd></div>
                  <div><dt>Seller</dt><dd>{selectedCar.seller?.username || 'Seller'}</dd></div>
                </dl>
                <dl>
                  <div><dt>Engine</dt><dd>{selectedCar.fuel_type}</dd></div>
                  <div><dt>Drivetrain</dt><dd>Rear-wheel drive</dd></div>
                  <div><dt>Transmission</dt><dd>{selectedCar.transmission}</dd></div>
                  <div><dt>Body Style</dt><dd>Coupe</dd></div>
                  <div><dt>Exterior Color</dt><dd>Alpine White</dd></div>
                  <div><dt>Interior Color</dt><dd>Black with yellow</dd></div>
                  <div><dt>Seller Type</dt><dd>Dealer</dd></div>
                </dl>
              </div>

              <article className="detail-copy">
                <h2>Highlights</h2>
                <p>{selectedCar.description || 'Ownership documentation, clean paintwork and detailed inspection report are available for this vehicle.'}</p>
                <h2>Recent Service History</h2>
                <p>Fresh inspection, fluids checked, tires reviewed and interior prepared before the auction listing.</p>
                <h2>Equipment</h2>
                <p>Premium sound system, performance seats, parking assistance and driver-focused cockpit.</p>
                <h2>Ownership History</h2>
                <p>The listing data indicates careful ownership and regular mileage updates.</p>
                <h2>Seller Notes</h2>
                <p>Ask seller a question before bidding. Important details are reviewed before final sale.</p>
              </article>

              <section className="comments-panel">
                <div>
                  <h2>Comments</h2>
                  <span>Newest</span>
                </div>
                <form onSubmit={submitComment}>
                  <input
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Leave a Comment below"
                  />
                  <button type="submit" disabled={isCommentSending || !commentText.trim()}>
                    {isCommentSending ? 'Sending...' : 'Send'}
                  </button>
                </form>
                {(selectedCar.comments || []).length > 0 ? (
                  selectedCar.comments?.map((comment) => (
                    <p key={comment.id}><strong>{comment.username}</strong>{comment.text}</p>
                  ))
                ) : (
                  <p>No comments yet.</p>
                )}
              </section>
            </section>

            <aside className="other-auctions">
              <h2>Other auctions</h2>
              {relatedCars.map((car) => renderCarCard(car, true))}
            </aside>
          </div>
        </section>
      ) : (
        <>
          {page === 'home' && (
            <section className="featured-grid" aria-label="Featured cars">
              <article className="featured-card featured-large">
                <img src={heroImages[0]} alt="Porsche Panamera" />
                <div><h1>2020 Porsche Panamera 4</h1><span>Online auction</span></div>
              </article>
              <article className="featured-card">
                <img src={heroImages[1]} alt="Featured car" />
                <div><h2>Featured cars</h2><span>Top bids</span></div>
              </article>
              <article className="featured-card">
                <img src={heroImages[2]} alt="Newly added car" />
                <div><h2>Newly added</h2><span>Fresh stock</span></div>
              </article>
              <article className="featured-card featured-wide">
                <img src={heroImages[3]} alt="Ford Galaxie" />
                <div><h2>1964 Ford Galaxie 500 Convertible</h2><span>Classic collection</span></div>
              </article>
            </section>
          )}

          <section className={page === 'search' ? 'search-page auction-section' : 'auction-section'} id="auctions">
            {page === 'search' && (
              <div className="search-heading">
                <h1>{searchHeading}</h1>
                <div>
                  <button type="button" onClick={goHome}>Back to main page</button>
                  <button type="button" onClick={saveSearch}>Save Search and Notify Me Later</button>
                </div>
              </div>
            )}

            <div className="section-bar">
              <h2>{page === 'search' ? `${searchHeading} Auctions` : 'Auctions'}</h2>
              <div className="filters">
                <button
                  type="button"
                  className={activeFilter === 'ending' ? 'filter-chip active' : 'filter-chip'}
                  onClick={() => applyQuickFilter('ending')}
                >
                  Ending soon
                </button>
                <button
                  type="button"
                  className={activeFilter === 'new' ? 'filter-chip active' : 'filter-chip'}
                  onClick={() => applyQuickFilter('new')}
                >
                  New cars
                </button>
                <button
                  type="button"
                  className={activeFilter === 'watched' ? 'filter-chip active' : 'filter-chip'}
                  onClick={() => applyQuickFilter('watched')}
                >
                  Most watched
                </button>
                <select value={brand} onChange={(event) => updateBrand(event.target.value)}>
                  <option value="">All brands</option>
                  {brands.map((item) => <option key={item} value={item}>{item}</option>)}
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
                  <option value="-created_at">Recently ended</option>
                  <option value="mileage">Lowest mileage</option>
                  <option value="-mileage">Highest mileage</option>
                  <option value="price">Lowest price</option>
                  <option value="-price">Highest price</option>
                  <option value="-year">Newest year</option>
                </select>
              </div>
            </div>

            {carsError && <p className="cars-error">{carsError}</p>}

            <div className={page === 'search' ? 'search-results cars-grid' : 'cars-grid'}>
              {visibleCars.map((car) => renderCarCard(car))}
            </div>
            {!isCarsLoading && visibleCars.length === 0 && (
              <div className="empty-state">
                <h3>No cars found</h3>
                <p>Try another model, brand or fuel type.</p>
                <button type="button" onClick={goHome}>Reset search</button>
              </div>
            )}

            <div className="pagination-bar">
              <span>{isCarsLoading ? 'Loading cars...' : `${carsCount} cars available`}</span>
              <div>
                <button type="button" disabled={!previousPage} onClick={() => setPageUrl(previousPage)}>Previous</button>
                <button type="button" disabled={!nextPage} onClick={() => setPageUrl(nextPage)}>Next</button>
              </div>
            </div>
          </section>
        </>
      )}

      {renderFooter()}
      {renderBidModal()}
      {renderAuthModal()}
    </main>
  )
}

export default App
