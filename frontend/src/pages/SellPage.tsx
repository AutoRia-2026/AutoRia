import type { FormEvent } from 'react'
import { brandOptions, colorOptions, fuelOptions } from '../constants/cars'
import type { SellListingForm, Car } from '../types/cars'
import { fallbackImage } from '../utils/cars'

type SellPageProps = {
  form: SellListingForm
  isSaving: boolean
  message: string
  error: string
  latestListing: Car | null
  setForm: (form: SellListingForm) => void
  submitListing: (event: FormEvent<HTMLFormElement>, status: 'active' | 'hidden') => void
  saveDraft: () => void
  cancel: () => void
}

const yearOptions = Array.from({ length: 27 }, (_, index) => String(2026 - index))
const conditionOptions = ['New', 'Used-Excellent', 'Used-Good', 'Used-Fair', 'After repair']
const transmissionOptions = ['automatic', 'manual', 'robot', 'variator']
const bodyOptions = ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Wagon', 'Pickup', 'Van', 'Convertible']

function SellPage({
  form,
  isSaving,
  message,
  error,
  latestListing,
  setForm,
  submitListing,
  saveDraft,
  cancel,
}: SellPageProps) {
  const previewImage = form.images.find((image) => image.trim()) || (latestListing ? fallbackImage(latestListing) : '')

  function updateField<K extends keyof SellListingForm>(field: K, value: SellListingForm[K]) {
    setForm({ ...form, [field]: value })
  }

  function updateImage(index: number, value: string) {
    const images = [...form.images]
    images[index] = value
    setForm({ ...form, images })
  }

  function readImageFile(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) {
      return
    }

    const selectedFiles = Array.from(files).slice(0, 3)
    const uploadedImages = await Promise.all(selectedFiles.map(readImageFile))
    const images = [...form.images]
    uploadedImages.forEach((image, index) => {
      images[index] = image
    })
    setForm({ ...form, images })
  }

  return (
    <section className="sell-page">
      <section className="sell-hero">
        <div className="sell-hero-copy">
          <h1>Sell your car</h1>
          <p>List your car in minutes and reach thousands of interested buyers.</p>
          <ul>
            <li><strong>Fast Listing</strong><span>Create your listing in just a few minutes.</span></li>
            <li><strong>Reach More Buyers</strong><span>Your car will be seen by thousands.</span></li>
            <li><strong>We protect you</strong><span>Stay updated throughout the process.</span></li>
            <li><strong>High visibility</strong><span>Your car gets seen by real shoppers.</span></li>
          </ul>
          <div>
            <button type="button" onClick={() => document.getElementById('sell-form')?.scrollIntoView({ behavior: 'smooth' })}>Create Listing</button>
            <button type="button" onClick={() => document.getElementById('price-contact')?.scrollIntoView({ behavior: 'smooth' })}>How it works</button>
          </div>
        </div>
      </section>

      <form id="sell-form" className="sell-form" onSubmit={(event) => submitListing(event, 'active')}>
        <aside className="sell-steps" aria-label="Listing steps">
          <span className="active">1 Basic Information</span>
          <span>2 Photos</span>
          <span>3 Price & Contact</span>
        </aside>

        <div className="sell-form-body">
          <section className="sell-panel">
            <h2>Basic Information</h2>
            <p>Let's start with some basic details about your vehicle.</p>
            <div className="sell-grid">
              <label>
                Make
                <select value={form.brand} onChange={(event) => updateField('brand', event.target.value)} required>
                  <option value="">Select Make</option>
                  {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </label>
              <label>
                Model
                <input value={form.model} onChange={(event) => updateField('model', event.target.value)} placeholder="Select Model" required />
              </label>
              <label>
                Year
                <select value={form.year} onChange={(event) => updateField('year', event.target.value)} required>
                  <option value="">Select Year</option>
                  {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
              <label>
                Body Type
                <select value={form.body_type} onChange={(event) => updateField('body_type', event.target.value)}>
                  <option value="">Select Body Type</option>
                  {bodyOptions.map((body) => <option key={body} value={body}>{body}</option>)}
                </select>
              </label>
              <label>
                Fuel Type
                <select value={form.fuel_type} onChange={(event) => updateField('fuel_type', event.target.value)} required>
                  <option value="">Select Fuel Type</option>
                  {fuelOptions.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}
                </select>
              </label>
              <label>
                Transmission
                <select value={form.transmission} onChange={(event) => updateField('transmission', event.target.value)} required>
                  <option value="">Select Transmission</option>
                  {transmissionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label>
                Mileage
                <input value={form.mileage} onChange={(event) => updateField('mileage', event.target.value)} inputMode="numeric" placeholder="e.g. 45,000 km" required />
              </label>
              <label>
                Condition
                <select value={form.condition} onChange={(event) => updateField('condition', event.target.value)}>
                  <option value="">Select Condition</option>
                  {conditionOptions.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
                </select>
              </label>
              <label>
                Color
                <select value={form.color} onChange={(event) => updateField('color', event.target.value)}>
                  <option value="">Select Color</option>
                  {colorOptions.map((color) => <option key={color} value={color}>{color}</option>)}
                </select>
              </label>
            </div>
            <label>
              Description
              <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} maxLength={1000} placeholder="Describe your car" />
              <span>{form.description.length}/1000</span>
            </label>
          </section>

          <section className="sell-panel">
            <h2>Photos</h2>
            <p>Upload clear photos to make your listing more attractive.</p>
            <div className="sell-photo-drop">
              {previewImage ? <img src={previewImage} alt="Listing preview" /> : <span className="photo-icon">Image</span>}
              <strong>Add up to 3 photos</strong>
              <label className="upload-photo-button">
                Upload Photos
                <input type="file" accept="image/*" multiple onChange={(event) => void uploadImages(event.target.files)} />
              </label>
              <small>Paste image URLs below</small>
            </div>
            <div className="sell-image-grid">
              {form.images.map((image, index) => (
                <label key={index}>
                  Photo {index + 1}
                  <input value={image} onChange={(event) => updateImage(index, event.target.value)} placeholder="https://example.com/car.jpg" />
                </label>
              ))}
            </div>
          </section>

          <section className="sell-panel" id="price-contact">
            <h2>Price & Contact</h2>
            <p>Set your price and add your contact information for interested buyers.</p>
            <div className="sell-grid">
              <label>
                Price
                <input value={form.price} onChange={(event) => updateField('price', event.target.value)} inputMode="numeric" placeholder="Select Price" required />
              </label>
              <label>
                Phone Number
                <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Your phone number" />
              </label>
              <label>
                Full Name
                <input value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} placeholder="Your full name" />
              </label>
              <label>
                City
                <input value={form.city} onChange={(event) => updateField('city', event.target.value)} placeholder="Your city" />
              </label>
              <label>
                Email
                <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="youremail@gmail.com" />
              </label>
            </div>
            <label className="rent-toggle">
              <input type="checkbox" checked={form.is_available_for_rent} onChange={(event) => updateField('is_available_for_rent', event.target.checked)} />
              Also make this car available for rent
            </label>
            {form.is_available_for_rent && (
              <div className="sell-grid rental-grid">
                <label>
                  Rent per day
                  <input value={form.rent_price_per_day} onChange={(event) => updateField('rent_price_per_day', event.target.value)} inputMode="numeric" placeholder="120" />
                </label>
                <label>
                  Rent per week
                  <input value={form.rent_price_per_week} onChange={(event) => updateField('rent_price_per_week', event.target.value)} inputMode="numeric" placeholder="760" />
                </label>
                <label>
                  Deposit
                  <input value={form.rent_deposit} onChange={(event) => updateField('rent_deposit', event.target.value)} inputMode="numeric" placeholder="500" />
                </label>
                <label>
                  Minimum rent days
                  <input value={form.minimum_rent_days} onChange={(event) => updateField('minimum_rent_days', event.target.value)} inputMode="numeric" placeholder="1" />
                </label>
              </div>
            )}
          </section>

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}

          <div className="sell-actions">
            <button type="button" onClick={cancel}>Cancel</button>
            <button type="button" onClick={saveDraft} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Draft'}</button>
            <button type="submit" disabled={isSaving}>{isSaving ? 'Publishing...' : 'Publish Listing'}</button>
          </div>
        </div>
      </form>
    </section>
  )
}

export default SellPage
