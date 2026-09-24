import type { ProfileSection, User } from '../types/auth'
import DriveHubLogo from './DriveHubLogo'

type HeaderProps = {
  user: User | null
  goHome: () => void
  openRent: () => void
  openSell: () => void
  openCompare: () => void
  openMessages: () => void
  openAuth: () => void
  openProfile: (section?: ProfileSection) => void
  openSupport: () => void
  goBack: () => void
  canGoBack: boolean
  applyBuyTab: (tab: string) => void
}

function Header({
  user,
  goHome,
  openRent,
  openSell,
  openCompare,
  openMessages,
  openAuth,
  openProfile,
  openSupport,
  goBack,
  canGoBack,
  applyBuyTab,
}: HeaderProps) {
  const profileName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username : ''
  const profileInitial = (profileName.trim()[0] || 'U').toUpperCase()
  const avatarUrl = user?.seller_profile?.avatar_url?.trim()

  return (
    <header className="buy-header">
      <DriveHubLogo onClick={goHome} />
      <nav aria-label="Primary navigation">
        {canGoBack && <button type="button" className="back-nav-button" onClick={goBack}>Back</button>}
        <button type="button" onClick={goHome}>Home</button>
        <button type="button" onClick={() => user ? openProfile('edit') : openAuth()}>Profile</button>
        <button type="button" onClick={openMessages}>Messages</button>
        <button type="button" onClick={openRent}>Rent</button>
        <button type="button" onClick={() => applyBuyTab('All cars')}>Buy</button>
        <button type="button" onClick={openCompare}>Compare</button>
        <button type="button" onClick={openSell}>Sell</button>
      </nav>
      <div className="buy-header-actions">
        <button
          type="button"
          className="header-circle-button"
          onClick={() => user ? openProfile('favorites') : openAuth()}
          aria-label="Favorites"
          title="Favorites"
        >
          {'♡'}
        </button>
        <button
          type="button"
          className="header-circle-button"
          onClick={openSupport}
          aria-label="Help"
          title="Help"
        >
          ?
        </button>
        {user ? (
          <button
            type="button"
            className="profile-avatar-button"
            onClick={() => openProfile('edit')}
            aria-label="Open profile"
            title={profileName}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span className="profile-avatar-initial">{profileInitial}</span>
            )}
          </button>
        ) : (
          <button type="button" onClick={openAuth}>Log in</button>
        )}
      </div>
    </header>
  )
}

export default Header
