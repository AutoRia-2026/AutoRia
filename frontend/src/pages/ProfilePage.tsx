import { useState } from 'react'
import type { FormEvent } from 'react'
import BuyCarCard from '../components/BuyCarCard'
import type { ProfileForm, ProfileSection, User } from '../types/auth'
import type { Car } from '../types/cars'
import { fallbackImage, formatMileage, formatPrice } from '../utils/cars'

type ProfilePageProps = {
  user: User
  activeSection: ProfileSection
  favoriteCars: Car[]
  myListings: Car[]
  profileForm: ProfileForm
  profileMessage: string
  profileError: string
  isProfileSaving: boolean
  isFavoritesLoading: boolean
  isListingsLoading: boolean
  setActiveSection: (value: ProfileSection) => void
  setProfileForm: (value: ProfileForm) => void
  submitProfile: (event: FormEvent<HTMLFormElement>) => void
  openLogout: () => void
  openCar: (car: Car) => void
  toggleLike: (car: Car) => void
  promoteListing: (car: Car) => void
  updateListing: (car: Car, payload: Partial<Pick<Car, 'price' | 'description' | 'status'>>) => void
  showNotice: (message: string) => void
}

const menuItems: { label: string; section: ProfileSection }[] = [
  { label: 'Edit Account', section: 'edit' },
  { label: 'My Favorites', section: 'favorites' },
  { label: 'Notifications', section: 'notifications' },
  { label: 'History', section: 'history' },
  { label: 'My Listings', section: 'listings' },
  { label: 'Settings', section: 'settings' },
  { label: 'Support', section: 'support' },
]

const countries = ['Ukraine', 'Germany', 'United States', 'South Korea', 'Japan', 'Canada', 'Italy', 'France']

function ProfilePage({
  user,
  activeSection,
  favoriteCars,
  myListings,
  profileForm,
  profileMessage,
  profileError,
  isProfileSaving,
  isFavoritesLoading,
  isListingsLoading,
  setActiveSection,
  setProfileForm,
  submitProfile,
  openLogout,
  openCar,
  toggleLike,
  promoteListing,
  updateListing,
  showNotice,
}: ProfilePageProps) {
  const displayName = profileForm.first_name || user.first_name || user.username
  const isEdit = activeSection === 'edit'
  const showProfileBanner = ['favorites', 'notifications', 'history', 'support'].includes(activeSection)
  const [listingStatus, setListingStatus] = useState('all')
  const [notificationsRead, setNotificationsRead] = useState(false)

  return (
    <section className="account-page">
      <aside className="account-sidebar">
        <div className="account-user">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80" alt={displayName} />
          <span>Welcome</span>
          <strong>{displayName}</strong>
        </div>
        <nav>
          {menuItems.map((item) => (
            <button
              key={item.section}
              type="button"
              className={activeSection === item.section ? 'active' : ''}
              onClick={() => {
                setActiveSection(item.section)
              }}
            >
              {item.label}
            </button>
          ))}
          <button type="button" className="logout-link" onClick={openLogout}>Log out</button>
        </nav>
      </aside>

      <section className="account-main">
        {showProfileBanner && <DriveHubBanner />}

        {isEdit && (
          <>
            <header>
              <h1>Edit Account</h1>
              <p>Update your account information and preferences.</p>
            </header>

            <form className="account-form" onSubmit={submitProfile}>
              <h2>Account Information</h2>
              <div className="account-grid">
                <label>
                  Name
                  <input type="text" value={profileForm.first_name} onChange={(event) => setProfileForm({ ...profileForm, first_name: event.target.value })} placeholder="Sofia Zaiats" />
                </label>
                <label>
                  Username
                  <input type="text" value={profileForm.username} onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })} placeholder="sofiazaiats132" required />
                </label>
                <label>
                  Phone Number
                  <input type="text" value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} placeholder="+(380) 689678943" />
                </label>
                <label>
                  Date of Birth
                  <input type="date" value={profileForm.date_of_birth} onChange={(event) => setProfileForm({ ...profileForm, date_of_birth: event.target.value })} />
                </label>
                <label>
                  Country
                  <select value={profileForm.country} onChange={(event) => setProfileForm({ ...profileForm, country: event.target.value })}>
                    <option value="">Select country</option>
                    {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                  </select>
                </label>
              </div>

              <div className="account-divider" />
              <h2>Address</h2>
              <div className="account-grid">
                <label>
                  Street Address
                  <input type="text" value={profileForm.street_address} onChange={(event) => setProfileForm({ ...profileForm, street_address: event.target.value })} placeholder="517 Street" />
                </label>
                <label>
                  State/Province
                  <input type="text" value={profileForm.state_province} onChange={(event) => setProfileForm({ ...profileForm, state_province: event.target.value })} placeholder="Rivne" />
                </label>
                <label>
                  City
                  <input type="text" value={profileForm.city} onChange={(event) => setProfileForm({ ...profileForm, city: event.target.value })} placeholder="Rivne" />
                </label>
                <label>
                  Email
                  <input type="email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} required />
                </label>
              </div>

              {profileMessage && <p className="form-success">{profileMessage}</p>}
              {profileError && <p className="form-error">{profileError}</p>}

              <div className="account-actions">
                <button type="submit" disabled={isProfileSaving}>{isProfileSaving ? 'Saving...' : 'Save changes'}</button>
              </div>
            </form>
          </>
        )}

        {activeSection === 'favorites' && (
          <FavoritesSection
            cars={favoriteCars}
            isLoading={isFavoritesLoading}
            openCar={openCar}
            toggleLike={toggleLike}
          />
        )}

        {activeSection === 'notifications' && (
          <NotificationsSection
            notificationsRead={notificationsRead}
            setNotificationsRead={setNotificationsRead}
            showNotice={showNotice}
          />
        )}
        {activeSection === 'history' && <HistorySection showNotice={showNotice} />}
        {activeSection === 'listings' && (
          <ListingsSection
            cars={myListings}
            activeStatus={listingStatus}
            isLoading={isListingsLoading}
            setActiveStatus={setListingStatus}
            openCar={openCar}
            promoteListing={promoteListing}
            updateListing={updateListing}
            showNotice={showNotice}
          />
        )}
        {activeSection === 'settings' && <SettingsSection />}
        {activeSection === 'support' && <SupportSection />}
      </section>
    </section>
  )
}

function DriveHubBanner() {
  return (
    <div className="profile-banner">
      <span>DRIVE HUB</span>
    </div>
  )
}

function FavoritesSection({
  cars,
  isLoading,
  openCar,
  toggleLike,
}: {
  cars: Car[]
  isLoading: boolean
  openCar: (car: Car) => void
  toggleLike: (car: Car) => void
}) {
  const [sortBy, setSortBy] = useState('newest')
  const sortedCars = [...cars].sort((firstCar, secondCar) => {
    if (sortBy === 'oldest') return new Date(firstCar.created_at).getTime() - new Date(secondCar.created_at).getTime()
    if (sortBy === 'price-high') return Number(secondCar.price) - Number(firstCar.price)
    if (sortBy === 'price-low') return Number(firstCar.price) - Number(secondCar.price)
    return new Date(secondCar.created_at).getTime() - new Date(firstCar.created_at).getTime()
  })

  return (
    <section className="favorites-section">
      <div className="profile-section-head">
        <h1>My Favorites</h1>
        <label>
          Sort by
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
          </select>
        </label>
      </div>

      {isLoading && <p className="soft-note">Loading favorites...</p>}
      {!isLoading && cars.length === 0 && <p className="soft-note">Liked cars will appear here.</p>}

      <div className="favorites-grid">
        {sortedCars.map((car) => (
          <BuyCarCard key={car.id} car={car} openCar={openCar} toggleLike={toggleLike} />
        ))}
      </div>
    </section>
  )
}

function NotificationsSection({
  notificationsRead,
  setNotificationsRead,
  showNotice,
}: {
  notificationsRead: boolean
  setNotificationsRead: (value: boolean) => void
  showNotice: (message: string) => void
}) {
  const today = [
    ['New message', 'John Smith sent you a message about your BMW X5.', '5 min ago'],
    ['New offer received', 'You received an offer of $41,500 for your BMW X5.', '34 min ago'],
    ['New message', 'Hi! Is the BMW X5 still available?', '2 hour ago'],
  ]
  const yesterday = [['New message', 'Has the vehicle ever been involved in an accident?', 'Yesterday']]

  return (
    <section className="notifications-section">
      <div className="profile-section-head">
        <div>
          <h1>Notifications</h1>
          <p>Stay up to date with your account activity and vehicle listings.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNotificationsRead(true)
            showNotice('Notifications marked as read')
          }}
          disabled={notificationsRead}
        >
          {notificationsRead ? 'All read' : 'Mark all as read'}
        </button>
      </div>

      <NotificationGroup title="Today" items={today} muted={notificationsRead} showNotice={showNotice} />
      <NotificationGroup title="Yesterday" items={yesterday} muted={notificationsRead} showNotice={showNotice} />
      <p className="no-more-activity">No more activity</p>
    </section>
  )
}

function NotificationGroup({
  title,
  items,
  muted = false,
  showNotice,
}: {
  title: string
  items: string[][]
  muted?: boolean
  showNotice: (message: string) => void
}) {
  return (
    <div className="notification-group">
      <h2>{title}</h2>
      <div>
        {items.map(([label, text, time]) => (
          <article key={`${label}-${time}`} className={muted ? 'muted' : ''}>
            <span>{label === 'New offer received' ? 'Tag' : 'Msg'}</span>
            <div>
              <strong>{label}</strong>
              <p>{text}</p>
            </div>
            <time>{time}</time>
            <button type="button" aria-label="Notification menu" onClick={() => showNotice('Notification menu opened')}>...</button>
          </article>
        ))}
      </div>
    </div>
  )
}

function HistorySection({ showNotice }: { showNotice: (message: string) => void }) {
  const today = [
    ['Listing Published', 'Your BMW X5 listing has been successfully published.', '6 min ago'],
    ['Offer Accepted', 'You accepted an offer of $42,000 for your BMW X5.', '1 hour ago'],
    ['Listing Updated', 'You edited the price and description of your BMW X5 listing.', '5 hour ago'],
  ]
  const yesterday = [['Listing Viewed', 'Your listing received 45 new views.', 'Yesterday']]

  return (
    <section className="history-section">
      <div className="profile-section-head stacked">
        <h1>History</h1>
        <p>View your recent activity and track all important actions.</p>
      </div>
      <NotificationGroup title="Today" items={today} showNotice={showNotice} />
      <NotificationGroup title="Yesterday" items={yesterday} showNotice={showNotice} />
      <p className="no-more-activity">No more activity</p>
    </section>
  )
}

function ListingsSection({
  cars,
  activeStatus,
  isLoading,
  setActiveStatus,
  openCar,
  promoteListing,
  updateListing,
  showNotice,
}: {
  cars: Car[]
  activeStatus: string
  isLoading: boolean
  setActiveStatus: (value: string) => void
  openCar: (car: Car) => void
  promoteListing: (car: Car) => void
  updateListing: (car: Car, payload: Partial<Pick<Car, 'price' | 'description' | 'status'>>) => void
  showNotice: (message: string) => void
}) {
  const [sortBy, setSortBy] = useState('newest')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const tabs = [
    ['all', 'All Listings'],
    ['active', 'Active'],
    ['hidden', 'Pending'],
    ['sold', 'Sold'],
    ['expired', 'Expired'],
  ]
  const filteredCars = activeStatus === 'all'
    ? cars
    : activeStatus === 'expired'
      ? []
      : cars.filter((car) => car.status === activeStatus)
  const sortedCars = [...filteredCars].sort((firstCar, secondCar) => {
    if (sortBy === 'oldest') return new Date(firstCar.created_at).getTime() - new Date(secondCar.created_at).getTime()
    if (sortBy === 'price-high') return Number(secondCar.price) - Number(firstCar.price)
    if (sortBy === 'price-low') return Number(firstCar.price) - Number(secondCar.price)
    return new Date(secondCar.created_at).getTime() - new Date(firstCar.created_at).getTime()
  })

  return (
    <section className="listings-section">
      <div className="profile-section-head stacked">
        <h1>My Listings</h1>
        <p>Manage your car listings and track their performance.</p>
      </div>

      <div className="listing-toolbar">
        <div className="listing-tabs">
          {tabs.map(([status, label]) => {
            const count = status === 'all'
              ? cars.length
              : status === 'expired'
                ? 0
                : cars.filter((car) => car.status === status).length

            return (
              <button
                key={status}
                type="button"
                className={activeStatus === status ? 'active' : ''}
                onClick={() => setActiveStatus(status)}
              >
                {label} <span>{count}</span>
              </button>
            )
          })}
        </div>
        <label>
          Sort by
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
          </select>
        </label>
      </div>

      {isLoading && <p className="soft-note">Loading listings...</p>}
      {!isLoading && sortedCars.length === 0 && <p className="soft-note">No listings in this status.</p>}

      <div className="listing-list">
        {sortedCars.map((car) => {
          const isEditing = editingId === car.id

          return (
            <article key={car.id} className={`listing-row ${isEditing ? 'editing' : ''}`}>
              <button type="button" className="listing-image" onClick={() => openCar(car)}>
                <img src={fallbackImage(car)} alt={`${car.brand} ${car.model}`} />
                <span>{car.images?.length || 1}</span>
              </button>
              <div className="listing-main">
                <div className="listing-specs">
                  <strong>{car.brand}</strong>
                  <strong>{car.fuel_type}</strong>
                  <strong>{formatMileage(car.mileage)}</strong>
                  <strong>{car.year}</strong>
                  <span>Brand</span>
                  <span>Fuel type</span>
                  <span>Mileage</span>
                  <span>Year</span>
                </div>
                <p>Listed on {new Date(car.created_at).toLocaleDateString()}</p>
                {isEditing && (
                  <form
                    className="listing-edit-form"
                    onSubmit={(event) => {
                      event.preventDefault()
                      updateListing(car, {
                        price: editPrice,
                        description: editDescription,
                      })
                      setEditingId(null)
                    }}
                  >
                    <input value={editPrice} onChange={(event) => setEditPrice(event.target.value)} placeholder="Price" required />
                    <input value={editDescription} onChange={(event) => setEditDescription(event.target.value)} placeholder="Description" />
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                  </form>
                )}
              </div>
              <div className="listing-side">
                <span>{listingMetaText(car)}</span>
                <b className={`listing-status ${car.status}`}>{statusLabel(car.status)}</b>
                <strong>{formatPrice(car.price)}</strong>
                {car.status === 'sold' ? (
                  <button type="button" className="view-details-button" onClick={() => openCar(car)}>View Details</button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(car.id)
                      setEditPrice(car.price)
                      setEditDescription(car.description)
                    }}
                  >
                    Edit
                  </button>
                )}
                {car.status === 'active' && <button className="promote-button" type="button" onClick={() => promoteListing(car)}>{car.is_promoted ? 'Promoted' : 'Promote'}</button>}
                <button
                  type="button"
                  aria-label="Listing menu"
                  onClick={() => setOpenMenuId(openMenuId === car.id ? null : car.id)}
                >
                  ...
                </button>
                {openMenuId === car.id && (
                  <div className="listing-menu-popover">
                    <button type="button" onClick={() => openCar(car)}>View</button>
                    {car.status !== 'sold' ? (
                      <button type="button" onClick={() => updateListing(car, { status: 'sold' })}>Mark sold</button>
                    ) : (
                      <button type="button" onClick={() => updateListing(car, { status: 'active' })}>Activate</button>
                    )}
                    <button type="button" onClick={() => {
                      setOpenMenuId(null)
                      showNotice('Listing menu closed')
                    }}>
                      Close
                    </button>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
      <p className="no-more-activity">No more activity</p>
    </section>
  )
}

function statusLabel(status: string) {
  if (status === 'active') return 'Active'
  if (status === 'sold') return 'Sold'
  if (status === 'hidden') return 'Pending'
  return 'Expired'
}

function listingMetaText(car: Car) {
  if (car.status === 'sold') return 'Sold on May 5, 2023'
  if (car.status === 'hidden') return 'Under Review'
  return `Views: ${car.views_count}`
}

function SettingsSection() {
  const groups = [
    ['Platform Updates', 'Stay informed about new features, maintenance, and important platform announcements.'],
    ['New Offers', 'Get notified when buyers send you a new offer.'],
    ['Offer Updates', 'Receive updates when an offer is accepted, declined, or changed.'],
    ['Messages', 'Get notified when you receive a new message from a buyer or seller.'],
    ['Favorites', 'Receive updates when a vehicle in your favorites changes price or becomes unavailable.'],
    ['Account & Security', 'Receive alerts about password changes, login attempts, and security updates.'],
    ['Saved Searches', 'Be notified when new cars match your saved search criteria.'],
  ]

  return (
    <section className="settings-section">
      <h1>Settings</h1>
      <div className="settings-grid">
        {groups.map(([title, description]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
            <label><input type="checkbox" defaultChecked /> Email</label>
            <label><input type="checkbox" defaultChecked /> Website</label>
          </article>
        ))}
      </div>
    </section>
  )
}

function SupportSection() {
  return (
    <section className="support-section">
      <div className="profile-section-head stacked">
        <h1>Support</h1>
        <p>We are here to help. Find answers, get in touch, and manage your support requests.</p>
      </div>

      <article className="support-search">
        <h2>How can we help you?</h2>
        <input type="search" placeholder="Search for help" />
      </article>

      <article className="support-contact">
        <h2>Contact Support</h2>
        <p>1 Mar Street, New York</p>
        <p>+1 (515) 144-4564</p>
        <p>support@drivehub.com</p>
        <p>Mon-Fri 9:00 AM-6:00 PM</p>
      </article>
    </section>
  )
}

export default ProfilePage
