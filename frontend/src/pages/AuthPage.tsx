import type { FormEvent } from 'react'
import AuthCard from '../components/AuthCard'
import DriveHubLogo from '../components/DriveHubLogo'
import type { AuthScreen, User } from '../types/auth'

type AuthPageProps = {
  user: User | null
  authScreen: AuthScreen
  email: string
  name: string
  password: string
  confirmPassword: string
  code: string
  rememberMe: boolean
  message: string
  error: string
  isAuthLoading: boolean
  goHome: () => void
  openRent: () => void
  openBuy: () => void
  openSell: () => void
  openMessages: () => void
  openError: () => void
  openAuth: () => void
  setPageProfile: () => void
  showNotice: (message: string) => void
  setEmail: (value: string) => void
  setName: (value: string) => void
  setPassword: (value: string) => void
  setConfirmPassword: (value: string) => void
  setCode: (value: string) => void
  setRememberMe: (value: boolean) => void
  setAuthOpen: (value: boolean) => void
  changeAuthScreen: (screen: AuthScreen) => void
  submitLogin: (event: FormEvent<HTMLFormElement>) => void
  submitSignupInfo: (event: FormEvent<HTMLFormElement>) => void
  submitSignupPassword: (event: FormEvent<HTMLFormElement>) => void
  submitSignupCode: (event: FormEvent<HTMLFormElement>) => void
  submitForgot: (event: FormEvent<HTMLFormElement>) => void
  submitResetCode: (event: FormEvent<HTMLFormElement>) => void
  submitResetPassword: (event: FormEvent<HTMLFormElement>) => void
  submitSocialAuth: (provider: 'google' | 'facebook') => void
}

function AuthPage(props: AuthPageProps) {
  return (
    <main className="drive-auth-shell">
      <header className="drive-auth-header">
        <DriveHubLogo onClick={props.goHome} />
        <nav aria-label="Auth navigation">
          <button type="button" onClick={props.goHome}>Home</button>
          <button type="button" onClick={() => props.user ? props.setPageProfile() : props.openAuth()}>Profile</button>
          <button type="button" onClick={props.openMessages}>Messages</button>
          <button type="button" onClick={props.openRent}>Rent</button>
          <button type="button" onClick={props.openBuy}>Buy</button>
          <button type="button" onClick={props.openSell}>Sell</button>
        </nav>
        <div className="drive-header-icons">
          <button type="button" onClick={() => props.user ? props.setPageProfile() : props.openAuth()}>Fav</button>
          <button type="button" onClick={props.openError}>?</button>
        </div>
      </header>
      <section className="drive-auth-layout">
        <AuthCard {...props} showCloseButton={false} />
        <div className="drive-auth-copy">
          <h2>Drive Smarter. Choose Faster. Find Your Perfect Car.</h2>
          <p>From buying and selling to renting, explore trusted listings and discover the right car with confidence.</p>
        </div>
      </section>
    </main>
  )
}

export default AuthPage
