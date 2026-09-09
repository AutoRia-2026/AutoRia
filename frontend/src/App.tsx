import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

import { API_URL, REMEMBER_KEY, TOKEN_KEY, apiRequest, parseApiError } from './api/client'
import AuthCard from './components/AuthCard'
import Footer from './components/Footer'
import Header from './components/Header'
import AuthPage from './pages/AuthPage'
import BuyPage from './pages/BuyPage'
import CarDetailPage from './pages/CarDetailPage'
import ErrorPage from './pages/ErrorPage'
import HomePage from './pages/HomePage'
import LeaveReviewPage from './pages/LeaveReviewPage'
import LogoutPage from './pages/LogoutPage'
import ProfilePage from './pages/ProfilePage'
import ReviewsPage from './pages/ReviewsPage'
import ReviewSubmittedPage from './pages/ReviewSubmittedPage'
import type { AuthResponse, AuthScreen, Page, ProfileSection, User } from './types/auth'
import type { Car, CarComment, CarReview, CarsResponse } from './types/cars'
import { carTitle, formatPrice } from './utils/cars'

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
  const [modelFilter, setModelFilter] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [priceMax, setPriceMax] = useState('200000')
  const [yearMin, setYearMin] = useState('2015')
  const [yearMax, setYearMax] = useState('2024')
  const [mileageMax, setMileageMax] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [activeFilter, setActiveFilter] = useState('ending')
  const [activeBuyTab, setActiveBuyTab] = useState('All cars')
  const [pageUrl, setPageUrl] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [notice, setNotice] = useState('')
  const [profileSection, setProfileSection] = useState<ProfileSection>('edit')
  const [favoriteCars, setFavoriteCars] = useState<Car[]>([])
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false)
  const [myListings, setMyListings] = useState<Car[]>([])
  const [isListingsLoading, setIsListingsLoading] = useState(false)
  const [reviews, setReviews] = useState<CarReview[]>([])
  const [isReviewsLoading, setIsReviewsLoading] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [recommendSeller, setRecommendSeller] = useState(true)
  const [isReviewSending, setIsReviewSending] = useState(false)

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
    date_of_birth: '',
    country: '',
    street_address: '',
    state_province: '',
  })
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isProfileSaving, setIsProfileSaving] = useState(false)

  const models = useMemo(
    () => Array.from(new Set(cars.map((car) => car.model))).sort(),
    [cars],
  )

  const relatedCars = useMemo(
    () => cars.filter((car) => car.id !== selectedCar?.id).slice(0, 6),
    [cars, selectedCar],
  )

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
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = hashParams.get('access_token')
    const provider = hashParams.get('state')

    if (!accessToken || (provider !== 'google' && provider !== 'facebook')) {
      return
    }

    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    void completeSocialAuth(provider, accessToken)
  }, [])

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
      date_of_birth: user.seller_profile?.date_of_birth || '',
      country: user.seller_profile?.country || '',
      street_address: user.seller_profile?.street_address || '',
      state_province: user.seller_profile?.state_province || '',
    })
  }, [user])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams()

    if (search.trim()) params.set('search', search.trim())
    if (brand) params.set('brand', brand)
    if (modelFilter) params.set('model', modelFilter)
    if (fuelType) params.set('fuel_type', fuelType)
    if (priceMax) params.set('price_max', priceMax)
    if (yearMin) params.set('year_min', yearMin)
    if (yearMax) params.set('year_max', yearMax)
    if (mileageMax) params.set('mileage_max', mileageMax)
    if (ordering) params.set('ordering', ordering)

    const url = pageUrl || `${API_URL}/cars/?${params.toString()}`

    setIsCarsLoading(true)
    setCarsError('')

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw await response.json()
        return response.json()
      })
      .then((data: CarsResponse) => {
        setCars(data.results)
        setCarsCount(data.count)
        setNextPage(data.next)
        setPreviousPage(data.previous)
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setCarsError('Cars could not be loaded')
      })
      .finally(() => setIsCarsLoading(false))

    return () => controller.abort()
  }, [brand, fuelType, mileageMax, modelFilter, ordering, pageUrl, priceMax, refreshIndex, search, yearMax, yearMin])

  useEffect(() => {
    if (page !== 'reviews') {
      return
    }

    setIsReviewsLoading(true)
    apiRequest('/cars/reviews/')
      .then((data) => setReviews(data as CarReview[]))
      .catch(() => showNotice('Reviews could not be loaded'))
      .finally(() => setIsReviewsLoading(false))
  }, [page])

  useEffect(() => {
    if (page !== 'profile' || profileSection !== 'favorites' || !token) {
      return
    }

    setIsFavoritesLoading(true)
    apiRequest('/cars/favorites/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then((data) => setFavoriteCars((data as CarsResponse).results))
      .catch(() => showNotice('Favorites could not be loaded'))
      .finally(() => setIsFavoritesLoading(false))
  }, [page, profileSection, refreshIndex, token])

  useEffect(() => {
    if (page !== 'profile' || profileSection !== 'listings' || !token) {
      return
    }

    setIsListingsLoading(true)
    apiRequest('/cars/my/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then((data) => setMyListings((data as CarsResponse).results))
      .catch(() => showNotice('Listings could not be loaded'))
      .finally(() => setIsListingsLoading(false))
  }, [page, profileSection, refreshIndex, token])

  function showNotice(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 2800)
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

  function resetFilters() {
    setSearch('')
    setBrand('')
    setModelFilter('')
    setFuelType('')
    setPriceMax('200000')
    setYearMin('2015')
    setYearMax('2024')
    setMileageMax('')
    setColorFilter('')
    setOrdering('-created_at')
    setActiveFilter('ending')
    setActiveBuyTab('All cars')
    setPageUrl(null)
  }

  function goHome() {
    resetFilters()
    setPage('home')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openBuy() {
    setPage('buy')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openProfile(section: ProfileSection = 'edit') {
    if (!token) {
      openAuth('login')
      return
    }

    setProfileSection(section)
    setPage('profile')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function updateSearch(value: string) {
    setSearch(value)
    setPageUrl(null)
    setPage('buy')
    setNotice('')
  }

  function updateBrand(value: string) {
    setBrand(value)
    setPageUrl(null)
    setPage('buy')
    setNotice('')
  }

  function updateModel(value: string) {
    setModelFilter(value)
    setPageUrl(null)
    setPage('buy')
    setNotice('')
  }

  function updateFuel(value: string) {
    setFuelType(value)
    setPageUrl(null)
    setPage('buy')
    setNotice('')
  }

  function updateOrdering(value: string) {
    setOrdering(value)
    setPageUrl(null)
    setPage('home')
    setNotice('')
  }

  function updatePriceMax(value: string) {
    setPriceMax(value)
    setPageUrl(null)
  }

  function updateYearRange(nextMin: string, nextMax: string) {
    setYearMin(nextMin)
    setYearMax(nextMax)
    setPageUrl(null)
  }

  function updateMileage(value: string) {
    setMileageMax(value)
    setPageUrl(null)
  }

  function applyBuyTab(tab: string) {
    setActiveBuyTab(tab)
    setPageUrl(null)
    setPage('buy')

    if (tab === 'All cars') {
      setYearMin('2015')
      setYearMax('2024')
      setPriceMax('200000')
      setOrdering('-created_at')
      return
    }

    if (tab === 'New cars') {
      setYearMin('2021')
      setYearMax('2024')
      setOrdering('-year')
      return
    }

    if (tab === 'Used cars') {
      setYearMin('2015')
      setYearMax('2020')
      setOrdering('price')
      return
    }

    if (tab === 'Deals') {
      setPriceMax('30000')
      setOrdering('price')
      return
    }

    showNotice(`${tab} filter will be connected when this backend field is added`)
  }

  async function saveSearch() {
    const filters = { brand, modelFilter, fuelType, priceMax, yearMin, yearMax, mileageMax, ordering, activeFilter }

    localStorage.setItem('autoria_saved_search', JSON.stringify({ search, ...filters }))

    if (!token) {
      openAuth('login')
      return
    }

    try {
      await apiRequest('/cars/saved-searches/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          title: search || brand || modelFilter || 'Saved car search',
          query: search,
          filters,
        }),
      })
      showNotice('Search saved')
    } catch (requestError) {
      showNotice(parseApiError(requestError))
    }
  }

  function openProtectedPage(nextPage: Page, fallbackMessage = 'Please sign in first') {
    if (!token) {
      openAuth('login')
      return
    }

    setPage(nextPage)
    if (fallbackMessage) showNotice(fallbackMessage)
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

  function openReviews() {
    setPage('reviews')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function startReview() {
    if (!token) {
      openAuth('login')
      return
    }

    if (!selectedCar && cars[0]) {
      setSelectedCar(cars[0])
    }

    setReviewRating(0)
    setReviewText('')
    setRecommendSeller(true)
    setPage('review-form')
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  async function completeSocialAuth(provider: 'google' | 'facebook', accessToken: string) {
    setError('')
    setIsAuthLoading(true)

    try {
      const data = (await apiRequest('/auth/social/', {
        method: 'POST',
        body: JSON.stringify({ provider, access_token: accessToken }),
      })) as AuthResponse

      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(REMEMBER_KEY, 'true')
      setRememberMe(true)
      setToken(data.token)
      setUser(data.user)
      setAuthOpen(false)
      setPage('home')
      showNotice(`${provider === 'google' ? 'Google' : 'Facebook'} account connected`)
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsAuthLoading(false)
    }
  }

  async function submitSocialAuth(provider: 'google' | 'facebook') {
    const providerName = provider === 'google' ? 'Google' : 'Facebook'
    const clientId = provider === 'google'
      ? import.meta.env.VITE_GOOGLE_CLIENT_ID
      : import.meta.env.VITE_FACEBOOK_APP_ID

    setError('')

    if (!clientId) {
      setError(`${providerName} login is not configured yet. Add the real OAuth keys to frontend and backend env.`)
      return
    }

    setIsAuthLoading(true)

    const redirectUri = `${window.location.origin}${window.location.pathname}`
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      state: provider,
    })

    if (provider === 'google') {
      params.set('scope', 'openid email profile')
      params.set('prompt', 'select_account')
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      return
    }

    params.set('scope', 'email,public_profile')
    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`
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
      const profilePayload = {
        ...profileForm,
        date_of_birth: profileForm.date_of_birth || null,
      }

      const data = (await apiRequest('/auth/me/', {
        method: 'PATCH',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(profilePayload),
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

  async function promoteListing(car: Car) {
    if (!token) {
      openAuth('login')
      return
    }

    try {
      const promotedCar = (await apiRequest(`/cars/${car.id}/promote/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
      })) as Car

      setMyListings((currentListings) => currentListings.map((listing) => listing.id === car.id ? promotedCar : listing))
      setCars((currentCars) => currentCars.map((listing) => listing.id === car.id ? promotedCar : listing))
      showNotice('Listing promoted')
    } catch (requestError) {
      showNotice(parseApiError(requestError))
    }
  }

  async function updateListing(car: Car, payload: Partial<Pick<Car, 'price' | 'description' | 'status'>>) {
    if (!token) {
      openAuth('login')
      return
    }

    try {
      const updatedCar = (await apiRequest(`/cars/${car.id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      })) as Car

      setMyListings((currentListings) => currentListings.map((listing) => listing.id === car.id ? updatedCar : listing))
      setCars((currentCars) => currentCars.map((listing) => listing.id === car.id ? updatedCar : listing))
      if (selectedCar?.id === car.id) setSelectedCar(updatedCar)
      showNotice('Listing updated')
    } catch (requestError) {
      showNotice(parseApiError(requestError))
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

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      openAuth('login')
      return
    }

    const car = selectedCar || cars[0]

    if (!car || reviewRating === 0 || !reviewText.trim()) {
      showNotice('Choose a rating and write a review')
      return
    }

    setIsReviewSending(true)

    try {
      const review = (await apiRequest(`/cars/${car.id}/reviews/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          text: reviewText.trim(),
          recommend_seller: recommendSeller,
        }),
      })) as CarReview

      setReviews((currentReviews) => [review, ...currentReviews])
      setSelectedCar({
        ...car,
        reviews: [review, ...(car.reviews || [])],
        reviews_count: (car.reviews_count || 0) + 1,
      })
      setReviewRating(0)
      setReviewText('')
      setRecommendSeller(true)
      setPage('review-submitted')
    } catch (requestError) {
      showNotice(parseApiError(requestError))
    } finally {
      setIsReviewSending(false)
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

  const authProps = {
    authScreen,
    email,
    name,
    password,
    confirmPassword,
    code,
    rememberMe,
    message,
    error,
    isAuthLoading,
    setEmail,
    setName,
    setPassword,
    setConfirmPassword,
    setCode,
    setRememberMe,
    setAuthOpen,
    changeAuthScreen,
    submitLogin,
    submitSignupInfo,
    submitSignupPassword,
    submitSignupCode,
    submitForgot,
    submitResetCode,
    submitResetPassword,
    submitSocialAuth,
  }

  function renderAuthModal() {
    if (!authOpen) {
      return null
    }

    return (
      <div className="auth-overlay">
        <AuthCard {...authProps} />
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
          <button className="icon-button close-button" type="button" aria-label="Close" onClick={() => setBidOpen(false)}>
            x
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

  if (page === 'auth' && !user) {
    return (
      <AuthPage
        {...authProps}
        user={user}
        goHome={goHome}
        openBuy={openBuy}
        openError={() => setPage('error')}
        openAuth={() => openAuth('login')}
        setPageProfile={() => openProfile('edit')}
        showNotice={showNotice}
      />
    )
  }

  return (
    <main className="app-shell">
      <Header
        user={user}
        goHome={goHome}
        openAuth={() => openAuth('login')}
        openProfile={openProfile}
        openError={() => setPage('error')}
        showNotice={showNotice}
        applyBuyTab={applyBuyTab}
        openProtectedPage={openProtectedPage}
      />
      {notice && <div className="toast-message">{notice}</div>}

      {page === 'profile' && user ? (
        <ProfilePage
          user={user}
          activeSection={profileSection}
          favoriteCars={favoriteCars}
          myListings={myListings}
          profileForm={profileForm}
          profileMessage={profileMessage}
          profileError={profileError}
          isProfileSaving={isProfileSaving}
          isFavoritesLoading={isFavoritesLoading}
          isListingsLoading={isListingsLoading}
          setActiveSection={setProfileSection}
          setProfileForm={setProfileForm}
          submitProfile={submitProfile}
          openLogout={() => setPage('logout')}
          openCar={openCar}
          toggleLike={toggleLike}
          promoteListing={promoteListing}
          updateListing={updateListing}
          showNotice={showNotice}
        />
      ) : page === 'logout' && user ? (
        <LogoutPage logout={logout} stayLoggedIn={() => setPage('profile')} />
      ) : page === 'detail' && selectedCar ? (
        <CarDetailPage
          car={selectedCar}
          relatedCars={relatedCars}
          bidMessage={bidMessage}
          commentText={commentText}
          isCommentSending={isCommentSending}
          setCommentText={setCommentText}
          setBidOpen={setBidOpen}
          submitComment={submitComment}
          toggleLike={toggleLike}
          openCar={openCar}
          openReviews={openReviews}
          startReview={startReview}
          showNotice={showNotice}
        />
      ) : page === 'reviews' ? (
        <ReviewsPage
          reviews={reviews}
          isLoading={isReviewsLoading}
          startReview={startReview}
          goHome={goHome}
        />
      ) : page === 'review-form' ? (
        <LeaveReviewPage
          car={selectedCar || cars[0] || null}
          rating={reviewRating}
          reviewText={reviewText}
          recommendSeller={recommendSeller}
          isSending={isReviewSending}
          setRating={setReviewRating}
          setReviewText={setReviewText}
          setRecommendSeller={setRecommendSeller}
          submitReview={submitReview}
          cancel={openReviews}
        />
      ) : page === 'review-submitted' ? (
        <ReviewSubmittedPage openReviews={openReviews} goHome={goHome} />
      ) : page === 'error' ? (
        <ErrorPage goHome={goHome} />
      ) : page === 'buy' ? (
        <BuyPage
          cars={visibleCars}
          carsCount={carsCount}
          models={models}
          search={search}
          brand={brand}
          modelFilter={modelFilter}
          fuelType={fuelType}
          priceMax={priceMax}
          yearMin={yearMin}
          yearMax={yearMax}
          mileageMax={mileageMax}
          colorFilter={colorFilter}
          ordering={ordering}
          activeBuyTab={activeBuyTab}
          isCarsLoading={isCarsLoading}
          carsError={carsError}
          previousPage={previousPage}
          nextPage={nextPage}
          goHome={goHome}
          saveSearch={saveSearch}
          updateSearch={updateSearch}
          updateBrand={updateBrand}
          updateModel={updateModel}
          updateFuel={updateFuel}
          updatePriceMax={updatePriceMax}
          updateYearRange={updateYearRange}
          updateMileage={updateMileage}
          setColorFilter={setColorFilter}
          updateOrdering={updateOrdering}
          applyBuyTab={applyBuyTab}
          setPageUrl={setPageUrl}
          showNotice={showNotice}
          openCar={openCar}
          toggleLike={toggleLike}
        />
      ) : (
        <HomePage
          cars={visibleCars}
          isCarsLoading={isCarsLoading}
          openCar={openCar}
          toggleLike={toggleLike}
          openBuy={openBuy}
          showNotice={showNotice}
        />
      )}

      <Footer
        showNotice={showNotice}
        openSupport={() => openProfile('support')}
        openBuy={openBuy}
        openError={() => setPage('error')}
      />
      {renderBidModal()}
      {renderAuthModal()}
    </main>
  )
}

export default App
