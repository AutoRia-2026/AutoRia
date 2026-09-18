import { useState } from 'react'
import type { FormEvent } from 'react'
import BuyCarCard from '../components/BuyCarCard'
import type { ProfileForm, ProfileSection, User } from '../types/auth'
import type { Car, Conversation, RentalBooking } from '../types/cars'
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
  conversations: Conversation[]
  rentalBookings: RentalBooking[]
  isBookingsLoading: boolean
  setActiveSection: (value: ProfileSection) => void
  setProfileForm: (value: ProfileForm) => void
  submitProfile: (event: FormEvent<HTMLFormElement>) => void
  openLogout: () => void
  openCar: (car: Car) => void
  toggleLike: (car: Car) => void
  promoteListing: (car: Car) => void
  updateListing: (car: Car, payload: Partial<Pick<Car, 'price' | 'description' | 'status'>>) => void
  updateBookingStatus: (booking: RentalBooking, action: 'confirm' | 'cancel') => void
  showNotice: (message: string) => void
}

const menuItems: { label: string; section: ProfileSection }[] = [
  { label: 'Edit Account', section: 'edit' },
  { label: 'Saved Cars', section: 'favorites' },
  { label: 'Notifications', section: 'notifications' },
  { label: 'Activity History', section: 'history' },
  { label: 'My Listings', section: 'listings' },
  { label: 'Rental Requests', section: 'bookings' },
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
  conversations,
  rentalBookings,
  isBookingsLoading,
  setActiveSection,
  setProfileForm,
  submitProfile,
  openLogout,
  openCar,
  toggleLike,
  promoteListing,
  updateListing,
  updateBookingStatus,
  showNotice,
}: ProfilePageProps) {
  const displayName = profileForm.first_name || user.first_name || user.username
  const initials = displayName.slice(0, 2).toUpperCase()
  const isEdit = activeSection === 'edit'
  const showProfileBanner = ['favorites', 'notifications', 'history', 'bookings', 'support'].includes(activeSection)
  const [listingStatus, setListingStatus] = useState('all')
  const [notificationsRead, setNotificationsRead] = useState(false)
  const [avatarFileName, setAvatarFileName] = useState('')

  return (
    <section className="account-page">
      <aside className="account-sidebar">
        <div className="account-user">
          {profileForm.avatar_url ? (
            <img src={profileForm.avatar_url} alt={displayName} />
          ) : (
            <div className="account-avatar-fallback" aria-label={displayName}>{initials}</div>
          )}
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
                <label>
                  Avatar URL
                  <input type="url" value={profileForm.avatar_url} onChange={(event) => setProfileForm({ ...profileForm, avatar_url: event.target.value })} placeholder="https://..." />
                </label>
                <label className="avatar-upload-field">
                  <span>Upload Avatar</span>
                  <span className="avatar-upload-control">
                    <span>{avatarFileName || 'No file selected'}</span>
                    <strong>Choose image</strong>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      setAvatarFileName(file.name)
                      const reader = new FileReader()
                      reader.onload = () => setProfileForm({ ...profileForm, avatar_url: String(reader.result || '') })
                      reader.readAsDataURL(file)
                    }}
                  />
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
            user={user}
            notificationsRead={notificationsRead}
            setNotificationsRead={setNotificationsRead}
            showNotice={showNotice}
            conversations={conversations}
          />
        )}
        {activeSection === 'history' && (
          <HistorySection
            user={user}
            cars={myListings}
            conversations={conversations}
            showNotice={showNotice}
          />
        )}
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
        {activeSection === 'bookings' && (
          <BookingsSection
            user={user}
            bookings={rentalBookings}
            isLoading={isBookingsLoading}
            updateBookingStatus={updateBookingStatus}
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
  user,
  notificationsRead,
  setNotificationsRead,
  showNotice,
  conversations,
}: {
  user: User
  notificationsRead: boolean
  setNotificationsRead: (value: boolean) => void
  showNotice: (message: string) => void
  conversations: Conversation[]
}) {
  const items = conversations
    .filter((conversation) => conversation.latest_message)
    .map((conversation) => [
      conversation.latest_message?.sender === user.id ? 'Message sent' : conversation.unread_count > 0 ? 'Unread message' : 'Message',
      conversationActivityText(conversation, user.id),
      new Date(conversation.updated_at).toLocaleString(),
    ])

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

      {items.length > 0 ? (
        <NotificationGroup title="Messages" items={items} muted={notificationsRead} showNotice={showNotice} />
      ) : (
        <p className="soft-note">No notifications yet. New messages and listing activity will appear here.</p>
      )}
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
          <article key={`${label}-${text}-${time}`} className={muted ? 'muted' : ''}>
            <span>{label.includes('offer') ? 'Tag' : 'Msg'}</span>
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

function conversationActivityText(conversation: Conversation, userId: number) {
  const latestMessage = conversation.latest_message
  const otherName = conversation.participant_name || (
    conversation.seller === userId ? conversation.buyer_name : conversation.seller_name
  )
  const listingTitle = conversation.car_title ? `about ${conversation.car_title}` : 'about this listing'
  const text = latestMessage?.text || 'Conversation opened'

  if (latestMessage?.sender === userId) {
    return conversation.seller === userId
      ? `You answered ${otherName} ${listingTitle}: ${text}`
      : `You wrote to ${otherName} ${listingTitle}: ${text}`
  }

  return conversation.seller === userId
    ? `${otherName} wrote to you ${listingTitle}: ${text}`
    : `${otherName} answered you ${listingTitle}: ${text}`
}

function HistorySection({
  user,
  cars,
  conversations,
  showNotice,
}: {
  user: User
  cars: Car[]
  conversations: Conversation[]
  showNotice: (message: string) => void
}) {
  const listingItems = cars.map((car) => ({
    label: car.status === 'sold' ? 'Sold listing' : car.status === 'hidden' ? 'Listing under review' : 'Published listing',
    text: `${car.brand} ${car.model} was listed with ${formatMileage(car.mileage)} mileage for ${formatPrice(car.price)}.`,
    time: new Date(car.created_at).toLocaleString(),
    sortTime: new Date(car.created_at).getTime(),
  }))
  const messageItems = conversations
    .filter((conversation) => conversation.latest_message)
    .map((conversation) => ({
      label: conversation.latest_message?.sender === user.id ? 'Message sent' : 'Message received',
      text: conversationActivityText(conversation, user.id),
      time: new Date(conversation.updated_at).toLocaleString(),
      sortTime: new Date(conversation.updated_at).getTime(),
    }))
  const items = [...messageItems, ...listingItems]
    .sort((firstItem, secondItem) => secondItem.sortTime - firstItem.sortTime)
    .map((item) => [item.label, item.text, item.time])

  return (
    <section className="history-section">
      <div className="profile-section-head stacked">
        <h1>Activity History</h1>
        <p>Track your messages, listing updates and seller actions in one timeline.</p>
      </div>
      {items.length > 0 ? (
        <NotificationGroup title="Recent activity" items={items} showNotice={showNotice} />
      ) : (
        <p className="soft-note">No activity yet. Messages, published listings and sales updates will appear here.</p>
      )}
      <p className="no-more-activity">No more activity</p>
    </section>
  )
}

function BookingsSection({
  user,
  bookings,
  isLoading,
  updateBookingStatus,
}: {
  user: User
  bookings: RentalBooking[]
  isLoading: boolean
  updateBookingStatus: (booking: RentalBooking, action: 'confirm' | 'cancel') => void
}) {
  const safeBookings = Array.isArray(bookings) ? bookings : []
  const sortedBookings = [...safeBookings].sort((firstBooking, secondBooking) => (
    new Date(secondBooking.created_at).getTime() - new Date(firstBooking.created_at).getTime()
  ))
  const incomingBookings = sortedBookings.filter((booking) => booking.seller === user.id)
  const outgoingBookings = sortedBookings.filter((booking) => booking.renter === user.id)
  const formatBookingDate = (date: string) => {
    const parsedDate = new Date(date)
    return Number.isNaN(parsedDate.getTime()) ? date || 'Not specified' : parsedDate.toLocaleDateString()
  }
  const formatBookingMoney = (value: string) => (
    Number.isFinite(Number(value)) ? formatPrice(value) : '$0'
  )
  const statusNote = (booking: RentalBooking, isSeller: boolean) => {
    if (booking.status === 'confirmed') return isSeller ? 'Confirmed for renter' : 'Confirmed by seller'
    if (booking.status === 'cancelled') return 'Cancelled'
    return isSeller ? 'Waiting for your decision' : 'Waiting for seller'
  }
  const renderBooking = (booking: RentalBooking, isSeller: boolean) => {
    const canManage = isSeller && booking.status === 'pending'
    const status = booking.status || 'pending'

    return (
      <article key={booking.id} className="booking-row">
        <img src={booking.car_image_url || '/vite.svg'} alt={booking.car_title || 'Rental booking'} />
        <div className="booking-main">
          <div>
            <h2>{booking.car_title || 'Rental booking'}</h2>
            <b className={`booking-status ${status}`}>{status}</b>
          </div>
          <p>
            {formatBookingDate(booking.start_date)} - {formatBookingDate(booking.end_date)}
            <span>{booking.days} day{booking.days === 1 ? '' : 's'}</span>
          </p>
          <p>
            {isSeller ? `Renter: ${booking.renter_name}` : `Seller: ${booking.seller_name}`}
            <span>Pickup: {booking.pickup_location || 'Not specified'}</span>
            {booking.dropoff_location && <span>Dropoff: {booking.dropoff_location}</span>}
          </p>
        </div>
        <div className="booking-side">
          <strong>{formatBookingMoney(booking.total_price)}</strong>
          <span>Deposit {formatBookingMoney(booking.deposit)}</span>
          {canManage ? (
            <div>
              <button type="button" onClick={() => updateBookingStatus(booking, 'confirm')}>Confirm</button>
              <button type="button" onClick={() => updateBookingStatus(booking, 'cancel')}>Cancel</button>
            </div>
          ) : (
            <em>{statusNote(booking, isSeller)}</em>
          )}
        </div>
      </article>
    )
  }

  return (
    <section className="bookings-section">
      <div className="profile-section-head stacked">
        <h1>Rental Requests</h1>
        <p>Incoming requests are cars you rent out. My requests are bookings you sent to other sellers.</p>
      </div>

      {isLoading && <p className="soft-note">Loading rental bookings...</p>}
      {!isLoading && sortedBookings.length === 0 && <p className="soft-note">Rental requests will appear here after a buyer sends a booking request.</p>}

      {incomingBookings.length > 0 && (
        <div className="booking-group">
          <h2>Incoming requests</h2>
          <div className="booking-list">
            {incomingBookings.map((booking) => renderBooking(booking, true))}
          </div>
        </div>
      )}

      {outgoingBookings.length > 0 && (
        <div className="booking-group">
          <h2>My rental requests</h2>
          <div className="booking-list">
            {outgoingBookings.map((booking) => renderBooking(booking, false))}
          </div>
        </div>
      )}
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
        <p>Kyiv, Ukraine</p>
        <p>+380 (67) 456-78-90</p>
        <p>support@drivehub.ua</p>
        <p>Mon-Fri 9:00-18:00</p>
      </article>
    </section>
  )
}

export default ProfilePage
