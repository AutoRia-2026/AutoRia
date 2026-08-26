import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'autoria_token'

type AuthMode = 'login' | 'register'

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

type AuthErrors = Record<string, string[] | string>

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return 'Не вдалося виконати запит.'
  }

  const errors = error as AuthErrors

  if (errors.non_field_errors) {
    return Array.isArray(errors.non_field_errors)
      ? errors.non_field_errors.join(' ')
      : errors.non_field_errors
  }

  const firstKey = Object.keys(errors)[0]
  const firstValue = errors[firstKey]

  if (Array.isArray(firstValue)) {
    return `${firstKey}: ${firstValue.join(' ')}`
  }

  return firstValue || 'Перевірте введені дані.'
}

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    fetch(`${API_URL}/auth/me/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await response.json()
        }

        return response.json()
      })
      .then((data: User) => setUser(data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken('')
        setUser(null)
      })
  }, [token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    const payload =
      mode === 'register'
        ? { email, username, password }
        : { email, password }

    try {
      const response = await fetch(`${API_URL}/auth/${mode}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw data
      }

      const authData = data as AuthResponse
      localStorage.setItem(TOKEN_KEY, authData.token)
      setToken(authData.token)
      setUser(authData.user)
      setPassword('')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogout() {
    setError('')

    if (token) {
      await fetch(`${API_URL}/auth/logout/`, {
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

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <p className="eyebrow">AutoRia DriveHub</p>
        <h1>Кабінет для роботи з оголошеннями авто</h1>
        <p className="hero-copy">
          Вхід потрібен, щоб додавати автомобілі, редагувати власні оголошення
          та працювати з лайками.
        </p>
      </section>

      <section className="auth-panel" aria-label="Авторизація">
        <div className="mode-tabs" aria-label="Перемикання форми">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login')
              setError('')
            }}
          >
            Вхід
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register')
              setError('')
            }}
          >
            Реєстрація
          </button>
        </div>

        {user ? (
          <div className="user-state">
            <span className="status-dot" aria-hidden="true"></span>
            <div>
              <h2>Ви увійшли</h2>
              <p>
                {user.email} · токен збережено в браузері
              </p>
            </div>
            <button type="button" className="secondary-button" onClick={handleLogout}>
              Вийти
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <h2>{mode === 'login' ? 'Увійти в акаунт' : 'Створити акаунт'}</h2>

            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ivan@example.com"
                required
              />
            </label>

            {mode === 'register' && (
              <label>
                Логін
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="ivan"
                  required
                />
              </label>
            )}

            <label>
              Пароль
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="мінімум 8 символів"
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading
                ? 'Зачекайте...'
                : mode === 'login'
                  ? 'Увійти'
                  : 'Зареєструватися'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default App
