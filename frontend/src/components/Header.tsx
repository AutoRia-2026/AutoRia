import type { ProfileSection, User } from '../types/auth'
import DriveHubLogo from './DriveHubLogo'

type HeaderProps = {
  user: User | null
  goHome: () => void
  openRent: () => void
  openSell: () => void
  openAuth: () => void
  openProfile: (section?: ProfileSection) => void
  openError: () => void
  applyBuyTab: (tab: string) => void
}

function Header({
  user,
  goHome,
  openRent,
  openSell,
  openAuth,
  openProfile,
  openError,
  applyBuyTab,
}: HeaderProps) {
  return (
    <header className="buy-header">
      <DriveHubLogo onClick={goHome} />
      <nav aria-label="Primary navigation">
        <button type="button" onClick={goHome}>Home</button>
        <button type="button" onClick={() => user ? openProfile('edit') : openAuth()}>Profile</button>
        <button type="button" onClick={() => user ? openProfile('notifications') : openAuth()}>Messages</button>
        <button type="button" onClick={openRent}>Rent</button>
        <button type="button" onClick={() => applyBuyTab('All cars')}>Buy</button>
        <button type="button" onClick={openSell}>Sell</button>
      </nav>
      <div className="buy-header-actions">
        <button type="button" onClick={() => user ? openProfile('favorites') : openAuth()} aria-label="Favorites">Fav</button>
        <button type="button" onClick={openError} aria-label="Help">?</button>
        {user ? (
          <button type="button" onClick={() => openProfile('edit')}>{user.first_name || user.username}</button>
        ) : (
          <button type="button" onClick={openAuth}>Log in</button>
        )}
      </div>
    </header>
  )
}

export default Header
