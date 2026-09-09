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
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import RentPage from './pages/RentPage'
import ReviewsPage from './pages/ReviewsPage'
import ReviewSubmittedPage from './pages/ReviewSubmittedPage'
import SellPage from './pages/SellPage'
import type { AuthResponse, AuthScreen, Page, ProfileSection, User } from './types/auth'
import type {
  Car,
  CarComment,
  CarReview,
  CarsResponse,
  Conversation,
  Message,
  RentalBooking,
  RentalBookingForm,
  SellListingForm,
} from './types/cars'
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
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messageText, setMessageText] = useState('')
  const [isConversationsLoading, setIsConversationsLoading] = useState(false)
  const [isMessageSending, setIsMessageSending] = useState(false)

  const [bidOpen, setBidOpen] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [bidMessage, setBidMessage] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookingForm, setBookingForm] = useState<RentalBookingForm>({
    start_date: '',
    end_date: '',
    pickup_location: '',
    dropoff_location: '',
  })
  const [bookingMessage, setBookingMessage] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [isBookingSending, setIsBookingSending] = useState(false)
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
  const [sellForm, setSellForm] = useState<SellListingForm>({
    brand: '',
    model: '',
    year: '',
    body_type: '',
    fuel_type: '',
    transmission: '',
    mileage: '',
    condition: '',
    color: '',
    description: '',
    price: '',
    phone: '',
    full_name: '',
    city: '',
    email: '',
    is_available_for_rent: true,
    rent_price_per_day: '',
    rent_price_per_week: '',
    rent_deposit: '',
    minimum_rent_days: '1',
    images: ['', '', ''],
  })
  const [sellMessage, setSellMessage] = useState('')
  const [sellError, setSellError] = useState('')
  const [isSellSaving, setIsSellSaving] = useState(false)
  const [latestListing, setLatestListing] = useState<Car | null>(null)

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
    setSellForm((currentForm) => ({
      ...currentForm,
      phone: currentForm.phone || user.seller_profile?.phone || '',
      full_name: currentForm.full_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '',
      city: currentForm.city || user.seller_profile?.city || '',
      email: currentForm.email || user.email || '',
    }))
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
    if (colorFilter) params.set('color', colorFilter)
    if (ordering) params.set('ordering', ordering)
    if (page === 'rent') params.set('rental', 'true')

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
  }, [brand, colorFilter, fuelType, mileageMax, modelFilter, ordering, page, pageUrl, priceMax, refreshIndex, search, yearMax, yearMin])

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

  useEffect(() => {
    if (page !== 'messages' || !token) {
      return
    }

    let isCurrent = true
    setIsConversationsLoading(true)

    apiRequest('/cars/conversations/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then((data) => {
        if (!isCurrent) {
          return
        }

        const loadedConversations = data as Conversation[]
        setConversations(loadedConversations)
        setActiveConversation((currentConversation) => (
          currentConversation
            ? loadedConversations.find((conversation) => conversation.id === currentConversation.id) || loadedConversations[0] || null
            : loadedConversations[0] || null
        ))
      })
      .catch((requestError) => {
        if (isCurrent) {
          showNotice(parseApiError(requestError))
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsConversationsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [page, token])

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

  function clearCatalogFilters(targetPage: 'buy' | 'rent') {
    resetFilters()
    setPage(targetPage)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goHome() {
    resetFilters()
    setPage('home')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openBuy() {
    setPage('buy')
    setPageUrl(null)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openRent() {
    setPage('rent')
    setPageUrl(null)
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openSell() {
    if (!token) {
      openAuth('login')
      return
    }

    setPage('sell')
    setSellMessage('')
    setSellError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openMessages() {
    if (!token) {
      openAuth('login')
      return
    }

    setPage('messages')
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
    setPage((currentPage) => currentPage === 'rent' ? 'rent' : 'buy')
    setNotice('')
  }

  function updateBrand(value: string) {
    setBrand(value)
    setPageUrl(null)
    setPage((currentPage) => currentPage === 'rent' ? 'rent' : 'buy')
    setNotice('')
  }

  function updateModel(value: string) {
    setModelFilter(value)
    setPageUrl(null)
    setPage((currentPage) => currentPage === 'rent' ? 'rent' : 'buy')
    setNotice('')
  }

  function updateFuel(value: string) {
    setFuelType(value)
    setPageUrl(null)
    setPage((currentPage) => currentPage === 'rent' ? 'rent' : 'buy')
    setNotice('')
  }

  function updateOrdering(value: string) {
    setOrdering(value)
    setPageUrl(null)
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

  function applyBuyTab(tab: string, targetPage: 'buy' | 'rent' = 'buy') {
    setActiveBuyTab(tab)
    setPageUrl(null)
    setPage(targetPage)

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

    if (tab === 'Certified pre-owned') {
      setSearch('certified')
      setOrdering('-year')
      return
    }

    if (tab === 'Import/Auctions') {
      setSearch('import auction')
      setOrdering('-created_at')
      return
    }
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

  async function selectConversation(conversation: Conversation) {
    if (!token) {
      openAuth('login')
      return
    }

    try {
      const data = (await apiRequest(`/cars/conversations/${conversation.id}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })) as Conversation

      setActiveConversation(data)
      setConversations((currentConversations) => currentConversations.map((item) => item.id === data.id ? data : item))
    } catch (requestError) {
      showNotice(parseApiError(requestError))
    }
  }

  async function contactSeller(car: Car) {
    if (!token) {
      openAuth('login')
      return
    }

    try {
      const conversation = (await apiRequest('/cars/conversations/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          car: car.id,
          text: `Hi, is the ${carTitle(car)} still available?`,
        }),
      })) as Conversation

      setConversations((currentConversations) => {
        const withoutCurrent = currentConversations.filter((item) => item.id !== conversation.id)
        return [conversation, ...withoutCurrent]
      })
      setActiveConversation(conversation)
      setMessageText('')
      setPage('messages')
      showNotice('Conversation started')
    } catch (requestError) {
      showNotice(parseApiError(requestError))
    }
  }

  function openBooking(car: Car) {
    if (!token) {
      openAuth('login')
      return
    }

    if (!car.is_available_for_rent) {
      showNotice('This car is not available for rent')
      return
    }

    setSelectedCar(car)
    setBookingMessage('')
    setBookingError('')
    setBookingOpen(true)
  }

  function resetSellForm() {
    setSellForm({
      brand: '',
      model: '',
      year: '',
      body_type: '',
      fuel_type: '',
      transmission: '',
      mileage: '',
      condition: '',
      color: '',
      description: '',
      price: '',
      phone: user?.seller_profile?.phone || '',
      full_name: user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username : '',
      city: user?.seller_profile?.city || '',
      email: user?.email || '',
      is_available_for_rent: true,
      rent_price_per_day: '',
      rent_price_per_week: '',
      rent_deposit: '',
      minimum_rent_days: '1',
      images: ['', '', ''],
    })
  }

  function cleanNumber(value: string) {
    return value.replace(/[^\d.]/g, '')
  }

  function buildSellPayload(status: 'active' | 'hidden') {
    const images = sellForm.images
      .map((image) => image.trim())
      .filter(Boolean)
      .map((image_url, position) => ({ image_url, position }))
    const descriptionParts = [
      sellForm.description.trim(),
      sellForm.phone.trim() ? `Phone: ${sellForm.phone.trim()}` : '',
      sellForm.full_name.trim() ? `Contact: ${sellForm.full_name.trim()}` : '',
      sellForm.city.trim() ? `City: ${sellForm.city.trim()}` : '',
      sellForm.email.trim() ? `Email: ${sellForm.email.trim()}` : '',
    ].filter(Boolean)

    return {
      brand: sellForm.brand,
      model: sellForm.model.trim(),
      year: Number(cleanNumber(sellForm.year)),
      mileage: Number(cleanNumber(sellForm.mileage)),
      price: cleanNumber(sellForm.price),
      transmission: sellForm.transmission,
      fuel_type: sellForm.fuel_type,
      body_type: sellForm.body_type,
      condition: sellForm.condition,
      color: sellForm.color,
      image_url: images[0]?.image_url || '',
      description: descriptionParts.join('\n'),
      status,
      is_available_for_rent: sellForm.is_available_for_rent,
      rent_price_per_day: sellForm.rent_price_per_day ? cleanNumber(sellForm.rent_price_per_day) : null,
      rent_price_per_week: sellForm.rent_price_per_week ? cleanNumber(sellForm.rent_price_per_week) : null,
      rent_deposit: sellForm.rent_deposit ? cleanNumber(sellForm.rent_deposit) : null,
      minimum_rent_days: Number(cleanNumber(sellForm.minimum_rent_days || '1')),
      images,
    }
  }

  async function createSellListing(status: 'active' | 'hidden') {
    if (!token) {
      openAuth('login')
      return
    }

    setSellMessage('')
    setSellError('')
    setIsSellSaving(true)

    try {
      const listing = (await apiRequest('/cars/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(buildSellPayload(status)),
      })) as Car

      setLatestListing(listing)
      setCars((currentCars) => [listing, ...currentCars])
      setMyListings((currentListings) => [listing, ...currentListings])
      setRefreshIndex((currentValue) => currentValue + 1)
      setSellMessage(status === 'active' ? 'Listing published' : 'Draft saved')
      resetSellForm()
      if (status === 'active') {
        showNotice('Listing published')
        openCar(listing)
      }
    } catch (requestError) {
      setSellError(parseApiError(requestError))
    } finally {
      setIsSellSaving(false)
    }
  }

  function submitSellListing(event: FormEvent<HTMLFormElement>, status: 'active' | 'hidden') {
    event.preventDefault()
    void createSellListing(status)
  }

  function saveSellDraft() {
    void createSellListing('hidden')
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

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      openAuth('login')
      return
    }

    if (!activeConversation || !messageText.trim()) {
      return
    }

    setIsMessageSending(true)
    try {
      const message = (await apiRequest(`/cars/conversations/${activeConversation.id}/messages/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ text: messageText.trim() }),
      })) as Message

      const updatedConversation = {
        ...activeConversation,
        latest_message: message,
        messages: [...activeConversation.messages, message],
        updated_at: message.created_at,
      }
      setActiveConversation(updatedConversation)
      setConversations((currentConversations) => [
        updatedConversation,
        ...currentConversations.filter((conversation) => conversation.id !== updatedConversation.id),
      ])
      setMessageText('')
    } catch (requestError) {
      showNotice(parseApiError(requestError))
    } finally {
      setIsMessageSending(false)
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

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setBookingOpen(false)
      openAuth('login')
      return
    }

    if (!selectedCar) {
      return
    }

    setIsBookingSending(true)
    setBookingError('')
    setBookingMessage('')

    try {
      const booking = (await apiRequest('/cars/bookings/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          car: selectedCar.id,
          start_date: bookingForm.start_date,
          end_date: bookingForm.end_date,
          pickup_location: bookingForm.pickup_location,
          dropoff_location: bookingForm.dropoff_location,
        }),
      })) as RentalBooking

      setBookingMessage(`Booking request sent. Total: ${formatPrice(booking.total_price)}`)
      showNotice('Rental booking request sent')
      setBookingForm({
        start_date: '',
        end_date: '',
        pickup_location: '',
        dropoff_location: '',
      })
    } catch (requestError) {
      setBookingError(parseApiError(requestError))
    } finally {
      setIsBookingSending(false)
    }
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

  function renderBookingModal() {
    if (!bookingOpen || !selectedCar) {
      return null
    }

    return (
      <div className="auth-overlay">
        <section className="auth-card bid-card rental-booking-card">
          <button className="icon-button close-button" type="button" aria-label="Close" onClick={() => setBookingOpen(false)}>
            x
          </button>
          <form className="auth-content compact-content" onSubmit={submitBooking}>
            <h1>Book rental</h1>
            <p className="modal-copy">{carTitle(selectedCar)} · ${selectedCar.effective_rent_price_per_day}/day</p>
            <label>
              Start date
              <input
                type="date"
                value={bookingForm.start_date}
                onChange={(event) => setBookingForm({ ...bookingForm, start_date: event.target.value })}
                required
              />
            </label>
            <label>
              End date
              <input
                type="date"
                value={bookingForm.end_date}
                onChange={(event) => setBookingForm({ ...bookingForm, end_date: event.target.value })}
                required
              />
            </label>
            <label>
              Pickup location
              <input
                type="text"
                value={bookingForm.pickup_location}
                onChange={(event) => setBookingForm({ ...bookingForm, pickup_location: event.target.value })}
                placeholder="Kyiv Center"
                required
              />
            </label>
            <label>
              Dropoff location
              <input
                type="text"
                value={bookingForm.dropoff_location}
                onChange={(event) => setBookingForm({ ...bookingForm, dropoff_location: event.target.value })}
                placeholder="Same as pickup"
              />
            </label>
            {bookingMessage && <p className="form-success">{bookingMessage}</p>}
            {bookingError && <p className="form-error">{bookingError}</p>}
            <button className="primary-button" type="submit" disabled={isBookingSending}>
              {isBookingSending ? 'Sending...' : 'Request booking'}
            </button>
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
        openRent={openRent}
        openBuy={openBuy}
        openSell={openSell}
        openMessages={openMessages}
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
        openRent={openRent}
        openSell={openSell}
        openMessages={openMessages}
        openAuth={() => openAuth('login')}
        openProfile={openProfile}
        openError={() => setPage('error')}
        applyBuyTab={applyBuyTab}
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
          openBooking={openBooking}
          submitComment={submitComment}
          toggleLike={toggleLike}
          contactSeller={contactSeller}
          openCar={openCar}
          openReviews={openReviews}
          startReview={startReview}
          showNotice={showNotice}
        />
      ) : page === 'messages' && user ? (
        <MessagesPage
          userId={user.id}
          conversations={conversations}
          activeConversation={activeConversation}
          messageText={messageText}
          isLoading={isConversationsLoading}
          isSending={isMessageSending}
          setActiveConversation={selectConversation}
          setMessageText={setMessageText}
          submitMessage={submitMessage}
          openBuy={openBuy}
        />
      ) : page === 'reviews' ? (
        <ReviewsPage
          reviews={reviews}
          isLoading={isReviewsLoading}
          startReview={startReview}
          goHome={() => clearCatalogFilters('buy')}
          showNotice={showNotice}
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
      ) : page === 'sell' && user ? (
        <SellPage
          form={sellForm}
          isSaving={isSellSaving}
          message={sellMessage}
          error={sellError}
          latestListing={latestListing}
          setForm={setSellForm}
          submitListing={submitSellListing}
          saveDraft={saveSellDraft}
          cancel={goHome}
        />
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
          goHome={() => clearCatalogFilters('buy')}
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
      ) : page === 'rent' ? (
        <RentPage
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
          goHome={() => clearCatalogFilters('rent')}
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
          applyBuyTab={(tab) => applyBuyTab(tab, 'rent')}
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
        openSupport={() => openProfile('support')}
        openBuy={openBuy}
        openError={() => setPage('error')}
      />
      {renderBidModal()}
      {renderBookingModal()}
      {renderAuthModal()}
    </main>
  )
}

export default App
