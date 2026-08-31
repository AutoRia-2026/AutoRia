import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'autoria_token'

type Screen =
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

type ApiError = Record<string, string[] | string>

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

function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [code, setCode] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  function changeScreen(nextScreen: Screen) {
    setScreen(nextScreen)
    setError('')
    setMessage('')
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const data = (await apiRequest('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })) as AuthResponse

      localStorage.setItem(TOKEN_KEY, data.token)
      setToken(data.token)
      setUser(data.user)
      setPassword('')
      setMessage('Signed in successfully')
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  function submitSignupInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    changeScreen('signup-password')
  }

  async function submitSignupPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

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
      changeScreen('signup-code')
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  async function submitSignupCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await apiRequest('/auth/verify-email/', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      })

      setCode('')
      setPassword('')
      setConfirmPassword('')
      setScreen('login')
      setMessage('Account created. Please sign in.')
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  async function submitForgot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await apiRequest('/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      changeScreen('check-email')
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  function openResetCode() {
    changeScreen('reset-code')
  }

  function submitResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    changeScreen('reset-password')
  }

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await apiRequest('/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ email, code, password }),
      })

      setPassword('')
      setConfirmPassword('')
      setCode('')
      setScreen('login')
      setMessage('Password changed. Please sign in.')
    } catch (requestError) {
      setError(parseApiError(requestError))
    } finally {
      setIsLoading(false)
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
    setScreen('login')
  }

  return (
    <main className="auth-shell">
      <div className="car-light" aria-hidden="true"></div>

      <section className="auth-card">
        {screen !== 'login' && (
          <button
            className="icon-button back-button"
            type="button"
            aria-label="Back"
            onClick={() => changeScreen(screen.startsWith('signup') ? 'signup-info' : 'login')}
          >
            ‹
          </button>
        )}

        <button className="icon-button close-button" type="button" aria-label="Close">
          ×
        </button>

        {user ? (
          <div className="auth-content signed-panel">
            <h1>Welcome</h1>
            <p>{user.email}</p>
            <button className="primary-button" type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        ) : (
          <>
            {screen === 'login' && (
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
                  <button className="link-button" type="button" onClick={() => changeScreen('forgot')}>
                    Forgot password?
                  </button>
                </div>

                {message && <p className="form-success">{message}</p>}
                {error && <p className="form-error">{error}</p>}

                <button className="primary-button" type="submit" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Continue'}
                </button>

                <div className="divider">
                  <span>or</span>
                </div>

                <div className="social-row">
                  <button type="button">G</button>
                  <button type="button">●</button>
                  <button type="button">f</button>
                </div>

                <p className="switch-copy">
                  Don't have an account?
                  <button type="button" onClick={() => changeScreen('signup-info')}>
                    Sign Up
                  </button>
                </p>
              </form>
            )}

            {screen === 'signup-info' && (
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
                  <button type="button">●</button>
                  <button type="button">f</button>
                </div>

                <p className="switch-copy">
                  Already have an account?
                  <button type="button" onClick={() => changeScreen('login')}>
                    Sign in here
                  </button>
                </p>
              </form>
            )}

            {screen === 'signup-password' && (
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

                <button className="primary-button" type="submit" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Create account'}
                </button>

                <p className="switch-copy">
                  Already have an account?
                  <button type="button" onClick={() => changeScreen('login')}>
                    Sign in here
                  </button>
                </p>
              </form>
            )}

            {screen === 'signup-code' && (
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

                <button className="primary-button" type="submit" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Verify account'}
                </button>
              </form>
            )}

            {screen === 'forgot' && (
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

                <button className="primary-button" type="submit" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Send email'}
                </button>
              </form>
            )}

            {screen === 'check-email' && (
              <div className="auth-content compact-content">
                <h1>Check your email</h1>
                <p className="modal-copy">We have sent the password reset code to your email.</p>
                <button className="primary-button" type="button" onClick={openResetCode}>
                  Continue
                </button>
              </div>
            )}

            {screen === 'reset-code' && (
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

            {screen === 'reset-password' && (
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

                <button className="primary-button" type="submit" disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Reset password'}
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default App
