export const API_URL = 'http://127.0.0.1:8000/api'
export const TOKEN_KEY = 'autoria_token'
export const REMEMBER_KEY = 'autoria_remember'

type ApiError = Record<string, string[] | string>

export function parseApiError(error: unknown) {
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

export async function apiRequest(path: string, options: RequestInit = {}) {
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
