export type Page = 'auth' | 'home' | 'buy' | 'rent' | 'sell' | 'messages' | 'detail' | 'profile' | 'logout' | 'reviews' | 'review-form' | 'review-submitted' | 'error'
export type ProfileSection = 'edit' | 'favorites' | 'notifications' | 'history' | 'listings' | 'settings' | 'support'

export type AuthScreen =
  | 'login'
  | 'signup-info'
  | 'signup-password'
  | 'signup-code'
  | 'forgot'
  | 'reset-code'
  | 'reset-password'
  | 'check-email'

export type User = {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  seller_profile?: {
    phone: string
    city: string
    date_of_birth: string | null
    country: string
    street_address: string
    state_province: string
  } | null
}

export type AuthResponse = {
  token: string
  user: User
}

export type ProfileForm = {
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  city: string
  date_of_birth: string
  country: string
  street_address: string
  state_province: string
}
