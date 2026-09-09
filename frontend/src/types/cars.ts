export type CarImage = {
  id: number
  image_url: string
  position: number
  created_at: string
}

export type CarComment = {
  id: number
  user: number
  username: string
  text: string
  created_at: string
}

export type CarReview = {
  id: number
  car: number
  car_title: string
  car_image_url: string
  user: number
  username: string
  rating: number
  text: string
  recommend_seller: boolean
  created_at: string
}

export type Car = {
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
  is_available_for_rent: boolean
  rent_price_per_day: string | null
  rent_price_per_week: string | null
  rent_deposit: string | null
  minimum_rent_days: number
  effective_rent_price_per_day: string
  transmission: string
  fuel_type: string
  body_type: string
  condition: string
  color: string
  image_url: string
  description: string
  status: string
  is_promoted: boolean
  promoted_at: string | null
  views_count: number
  likes_count: number
  images?: CarImage[]
  comments?: CarComment[]
  reviews?: CarReview[]
  reviews_count?: number
  created_at: string
}

export type CarsResponse = {
  count: number
  next: string | null
  previous: string | null
  results: Car[]
}

export type SellListingForm = {
  brand: string
  model: string
  year: string
  body_type: string
  fuel_type: string
  transmission: string
  mileage: string
  condition: string
  color: string
  description: string
  price: string
  phone: string
  full_name: string
  city: string
  email: string
  is_available_for_rent: boolean
  rent_price_per_day: string
  rent_price_per_week: string
  rent_deposit: string
  minimum_rent_days: string
  images: string[]
}

export type Message = {
  id: number
  conversation: number
  sender: number
  sender_name: string
  text: string
  is_read: boolean
  created_at: string
}

export type Conversation = {
  id: number
  car: number
  car_title: string
  car_image_url: string
  buyer: number
  buyer_name: string
  seller: number
  seller_name: string
  participant_name: string
  latest_message: Message | null
  unread_count: number
  messages: Message[]
  created_at: string
  updated_at: string
}
