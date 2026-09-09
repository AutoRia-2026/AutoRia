import type { FormEvent } from 'react'
import type { AuthScreen } from '../types/auth'

type AuthCardProps = {
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
  showCloseButton?: boolean
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

function AuthCard({
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
  showCloseButton = true,
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
}: AuthCardProps) {
  const isRegisterStep = authScreen.startsWith('signup')
  const isResetPassword = authScreen === 'reset-password' || authScreen === 'reset-code'
  const authTitle = authScreen === 'login'
    ? 'Welcome Back!'
    : isRegisterStep
      ? 'Welcome!'
      : isResetPassword
        ? 'Create New Password'
        : 'Forgot Password?'
  const authSubtitle = authScreen === 'login'
    ? 'Log in to discover your perfect car'
    : isRegisterStep
      ? 'Create your account and start exploring trusted car'
      : isResetPassword
        ? 'Create a strong password to secure your account'
        : "Don't worry. Enter your email address and we'll send you a link to reset your password"

  return (
    <section className="auth-card">
      {authScreen !== 'login' && (
        <button
          className="icon-button back-button"
          type="button"
          aria-label="Back"
          onClick={() => changeAuthScreen(authScreen.startsWith('signup') ? 'signup-info' : 'login')}
        >
          {'<'}
        </button>
      )}
      {showCloseButton && (
        <button
          className="icon-button close-button"
          type="button"
          aria-label="Close"
          onClick={() => setAuthOpen(false)}
        >
          x
        </button>
      )}

      {authScreen === 'login' && (
        <form className="auth-content" onSubmit={submitLogin}>
          <div className="auth-heading">
            <h1>{authTitle}</h1>
            <p>{authSubtitle}</p>
          </div>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="youremail@gmail.com" required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Input your password" required />
          </label>
          <div className="form-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              Remember me
            </label>
            <button className="link-button" type="button" onClick={() => changeAuthScreen('forgot')}>Forgot password?</button>
          </div>
          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={isAuthLoading}>{isAuthLoading ? 'Loading...' : 'Log in'}</button>
          <div className="divider"><span>or continue with</span></div>
          <div className="social-row">
            <button type="button" onClick={() => submitSocialAuth('google')}>Continue with Google</button>
            <button type="button" onClick={() => submitSocialAuth('facebook')}>Continue with Facebook</button>
          </div>
          <p className="switch-copy">
            Don't have an account?
            <button type="button" onClick={() => changeAuthScreen('signup-info')}>Register here</button>
          </p>
        </form>
      )}

      {authScreen === 'signup-info' && (
        <form className="auth-content" onSubmit={submitSignupInfo}>
          <div className="auth-heading">
            <h1>{authTitle}</h1>
            <p>{authSubtitle}</p>
          </div>
          <label>
            Name
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="youremail@gmail.com" required />
          </label>
          <button className="primary-button" type="submit">Continue</button>
          <div className="divider"><span>or</span></div>
          <div className="social-row">
            <button type="button" onClick={() => submitSocialAuth('google')}>Continue with Google</button>
            <button type="button" onClick={() => submitSocialAuth('facebook')}>Continue with Facebook</button>
          </div>
          <p className="switch-copy">
            Already have an account?
            <button type="button" onClick={() => changeAuthScreen('login')}>Log in here</button>
          </p>
        </form>
      )}

      {authScreen === 'signup-password' && (
        <form className="auth-content" onSubmit={submitSignupPassword}>
          <div className="auth-heading">
            <h1>{authTitle}</h1>
            <p>{authSubtitle}</p>
          </div>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Input your password" required />
          </label>
          <label>
            Confirm password
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Input your password" required />
          </label>
          <label className="checkbox-label auth-check">
            <input type="checkbox" required />
            I agree to the Terms of Service and Privacy Policy
          </label>
          <label className="checkbox-label auth-check">
            <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
            Remember me
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={isAuthLoading}>{isAuthLoading ? 'Loading...' : 'Create account'}</button>
          <p className="switch-copy">
            Already have an account?
            <button type="button" onClick={() => changeAuthScreen('login')}>Sign in here</button>
          </p>
        </form>
      )}

      {authScreen === 'signup-code' && (
        <form className="auth-content" onSubmit={submitSignupCode}>
          <div className="auth-heading">
            <h1>Check your email</h1>
            <p>We sent a verification code to your email.</p>
          </div>
          <label>
            Enter code
            <input type="text" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} placeholder="123456" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={isAuthLoading}>{isAuthLoading ? 'Loading...' : 'Verify account'}</button>
        </form>
      )}

      {authScreen === 'forgot' && (
        <form className="auth-content" onSubmit={submitForgot}>
          <div className="auth-heading">
            <h1>{authTitle}</h1>
            <p>{authSubtitle}</p>
          </div>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="youremail@gmail.com" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={isAuthLoading}>{isAuthLoading ? 'Loading...' : 'Send Reset Link'}</button>
          <button className="secondary-button" type="button" onClick={() => changeAuthScreen('login')}>Back to Login</button>
        </form>
      )}

      {authScreen === 'check-email' && (
        <div className="auth-content">
          <div className="auth-heading">
            <h1>Check your email</h1>
            <p>We have sent the password reset code to your email.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => changeAuthScreen('reset-code')}>Continue</button>
        </div>
      )}

      {authScreen === 'reset-code' && (
        <form className="auth-content" onSubmit={submitResetCode}>
          <div className="auth-heading">
            <h1>Create New Password</h1>
            <p>Enter the code from your email to continue.</p>
          </div>
          <label>
            Verification code
            <input type="text" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} placeholder="123456" required />
          </label>
          <button className="primary-button" type="submit">Continue</button>
        </form>
      )}

      {authScreen === 'reset-password' && (
        <form className="auth-content" onSubmit={submitResetPassword}>
          <div className="auth-heading">
            <h1>{authTitle}</h1>
            <p>{authSubtitle}</p>
          </div>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Input your password" required />
          </label>
          <label>
            Confirm password
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Input your password" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={isAuthLoading}>{isAuthLoading ? 'Loading...' : 'Update Password'}</button>
          <button className="secondary-button" type="button" onClick={() => changeAuthScreen('login')}>Back to Login</button>
        </form>
      )}
    </section>
  )
}

export default AuthCard
