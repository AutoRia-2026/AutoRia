import { useState } from 'react'
import type { Car } from '../types/cars'
import BuyCarCard from '../components/BuyCarCard'
import { carTitle, fallbackImage, formatMileage, formatPrice } from '../utils/cars'

type HomePageProps = {
  cars: Car[]
  isCarsLoading: boolean
  openCar: (car: Car) => void
  toggleLike: (car: Car) => void
  openBuy: () => void
  showNotice: (message: string) => void
}

const faqItems = [
  {
    question: 'Are all vehicle listings verified?',
    answer: 'Listings include seller details, vehicle data and activity signals so buyers can compare cars with more confidence.',
  },
  {
    question: 'Can I save cars for later?',
    answer: 'Yes. Use the heart button on any vehicle card and it will appear in your favorites inside your profile.',
  },
  {
    question: 'How do I contact a seller?',
    answer: 'Open a vehicle page and use Contact Seller to start the buying conversation from the listing.',
  },
]

function HomePage({ cars, isCarsLoading, openCar, toggleLike, openBuy }: HomePageProps) {
  const [activeDiscountIndex, setActiveDiscountIndex] = useState(0)
  const [openFaqIndex, setOpenFaqIndex] = useState(0)
  const bestCar = cars[activeDiscountIndex % Math.max(cars.length, 1)]
  const previewCars = cars.slice(0, 9)

  function changeDiscount(direction: -1 | 1) {
    if (!cars.length) {
      return
    }

    setActiveDiscountIndex((currentIndex) => (currentIndex + direction + cars.length) % cars.length)
  }

  return (
    <section className="home-page">
      <section className="home-hero">
        <div className="home-copy">
          <h1>Premium Car Marketplace for Confident Decisions</h1>
          <p>Browse verified vehicles, real market prices and trusted sellers in one place.</p>
          <button type="button" onClick={openBuy}>Browse Cars</button>
        </div>
      </section>

      <div className="home-stats">
        <article><strong>50K+</strong><span>Verified Cars</span></article>
        <article><strong>30K+</strong><span>Successful Deals</span></article>
        <article><strong>97%</strong><span>Customer Satisfaction</span></article>
        <article><strong>24/7</strong><span>Customer Support</span></article>
      </div>

      {bestCar && (
        <section className="best-discount">
          <h2>Best car discounts</h2>
          <div className="spotlight-car">
            <button type="button" className="spotlight-side" aria-label="Previous discount" onClick={() => changeDiscount(-1)} />
            <article>
              <img src={fallbackImage(bestCar)} alt={carTitle(bestCar)} />
              <div className="spotlight-meta">
                <span>{bestCar.brand}</span>
                <span>{bestCar.fuel_type}</span>
                <span>{formatMileage(bestCar.mileage)}</span>
                <span>{bestCar.year}</span>
              </div>
              <div className="spotlight-actions">
                <span>{formatPrice(String(Math.round(Number(bestCar.price) * 1.12)))}</span>
                <strong>{formatPrice(bestCar.price)}</strong>
                <button type="button" onClick={() => openCar(bestCar)}>Read more</button>
              </div>
            </article>
            <button type="button" className="spotlight-side next" aria-label="Next discount" onClick={() => changeDiscount(1)} />
          </div>
        </section>
      )}

      <section className="home-cars">
        <div className="section-row">
          <h2>Choose your car</h2>
          <button type="button" onClick={openBuy}>Show more</button>
        </div>
        {isCarsLoading && <p className="soft-note">Loading cars...</p>}
        <div className="buy-grid home-grid">
          {previewCars.map((car) => <BuyCarCard key={car.id} car={car} openCar={openCar} toggleLike={toggleLike} />)}
        </div>
      </section>

      <section className="services-block">
        <h2>Our services</h2>
        {['Selection to order', 'Commission sales', 'Rating and Trade-in'].map((service) => (
          <article key={service}>
            <div>
              <h3>{service}</h3>
              <p>We help with vehicle search, seller checks and deal preparation.</p>
            </div>
            <button type="button" onClick={openBuy}>More details</button>
          </article>
        ))}
      </section>

      <section className="faq-block">
        <div>
          <h2>Frequently Asked Questions</h2>
          <button type="button" onClick={openBuy}>Still have a question?</button>
        </div>
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <article key={item.question} className={openFaqIndex === index ? 'faq-item open' : 'faq-item'}>
              <button type="button" onClick={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}>
                {item.question}
                <span>v</span>
              </button>
              {openFaqIndex === index && <p>{item.answer}</p>}
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default HomePage
