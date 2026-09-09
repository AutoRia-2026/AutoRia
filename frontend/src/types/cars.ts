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
  transmission: string
  fuel_type: string
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
