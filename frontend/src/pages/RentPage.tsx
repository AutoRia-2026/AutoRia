import { buyTabs } from '../constants/cars'
import { API_URL } from '../api/client'
import type { Car } from '../types/cars'
import BuyCarCard from '../components/BuyCarCard'
import BuySidebar from '../components/BuySidebar'
import CompanyBlock from '../components/CompanyBlock'

type RentPageProps = {
  cars: Car[]
  carsCount: number
  models: string[]
  search: string
  brand: string
  modelFilter: string
  fuelType: string
  priceMax: string
  yearMin: string
  yearMax: string
  mileageMax: string
  colorFilter: string
  ordering: string
  activeBuyTab: string
  isCarsLoading: boolean
  carsError: string
  previousPage: string | null
  nextPage: string | null
  goHome: () => void
  saveSearch: () => void
  updateSearch: (value: string) => void
  updateBrand: (value: string) => void
  updateModel: (value: string) => void
  updateFuel: (value: string) => void
  updatePriceMax: (value: string) => void
  updateYearRange: (min: string, max: string) => void
  updateMileage: (value: string) => void
  setColorFilter: (value: string) => void
  updateOrdering: (value: string) => void
  applyBuyTab: (tab: string) => void
  setPageUrl: (url: string | null) => void
  showNotice: (message: string) => void
  openCar: (car: Car) => void
  toggleLike: (car: Car) => void
}

function RentPage({
  cars,
  carsCount,
  models,
  search,
  brand,
  modelFilter,
  fuelType,
  priceMax,
  yearMin,
  yearMax,
  mileageMax,
  colorFilter,
  ordering,
  activeBuyTab,
  isCarsLoading,
  carsError,
  previousPage,
  nextPage,
  goHome,
  saveSearch,
  updateSearch,
  updateBrand,
  updateModel,
  updateFuel,
  updatePriceMax,
  updateYearRange,
  updateMileage,
  setColorFilter,
  updateOrdering,
  applyBuyTab,
  setPageUrl,
  showNotice,
  openCar,
  toggleLike,
}: RentPageProps) {
  const heading = search.trim() || brand || modelFilter || 'Choose your car'
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(carsCount / pageSize))
  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1)

  function buildPageUrl(pageNumber: number) {
    if (pageNumber === 1) {
      return null
    }

    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (brand) params.set('brand', brand)
    if (modelFilter) params.set('model', modelFilter)
    if (fuelType) params.set('fuel_type', fuelType)
    if (priceMax) params.set('price_max', priceMax)
    if (yearMin) params.set('year_min', yearMin)
    if (yearMax) params.set('year_max', yearMax)
    if (mileageMax) params.set('mileage_max', mileageMax)
    if (colorFilter) params.set('color', colorFilter)
    if (ordering) params.set('ordering', ordering)
    params.set('rental', 'true')
    params.set('page', String(pageNumber))

    return `${API_URL}/cars/?${params.toString()}`
  }

  return (
    <section className="buy-page rent-page">
      <div className="buy-tabs">
        <h1>Rent</h1>
        <div>
          {buyTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeBuyTab === tab ? 'active' : ''}
              onClick={() => applyBuyTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="buy-content">
        <BuySidebar
          brand={brand}
          modelFilter={modelFilter}
          models={models}
          priceMax={priceMax}
          yearMin={yearMin}
          yearMax={yearMax}
          mileageMax={mileageMax}
          fuelType={fuelType}
          colorFilter={colorFilter}
          carsCount={carsCount}
          goHome={goHome}
          updateBrand={updateBrand}
          updateModel={updateModel}
          updatePriceMax={updatePriceMax}
          updateYearRange={updateYearRange}
          updateMileage={updateMileage}
          updateFuel={updateFuel}
          setColorFilter={setColorFilter}
          showNotice={showNotice}
        />

        <section className="buy-results">
          <div className="buy-results-head">
            <h2>{heading}</h2>
            <div>
              <button type="button" onClick={saveSearch}>Save search</button>
              <label>
                Sort by
                <select value={ordering} onChange={(event) => updateOrdering(event.target.value)}>
                  <option value="-created_at">Most popular</option>
                  <option value="-year">Newest</option>
                  <option value="price">Price low to high</option>
                  <option value="-price">Price high to low</option>
                  <option value="mileage">Lowest mileage</option>
                </select>
              </label>
            </div>
          </div>

          <label className="buy-search">
            <span>Search rentals</span>
            <input
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search by brand, model or year"
            />
          </label>

          {colorFilter && <p className="soft-note">Color filter selected: {colorFilter}</p>}
          {carsError && <p className="cars-error">{carsError}</p>}

          <div className="buy-grid">
            {cars.map((car) => <BuyCarCard key={car.id} car={car} mode="rent" openCar={openCar} toggleLike={toggleLike} />)}
          </div>

          {!isCarsLoading && cars.length === 0 && (
            <div className="empty-state">
              <h3>No rentals found</h3>
              <p>Try another model, brand or fuel type.</p>
              <button type="button" onClick={goHome}>Reset search</button>
            </div>
          )}

          <div className="buy-pagination">
            <button type="button" disabled={!previousPage} onClick={() => setPageUrl(previousPage)}>Prev</button>
            {pageNumbers.map((pageNumber) => (
              <button key={pageNumber} type="button" onClick={() => setPageUrl(buildPageUrl(pageNumber))}>
                {pageNumber}
              </button>
            ))}
            <button type="button" disabled={!nextPage} onClick={() => setPageUrl(nextPage)}>Next</button>
          </div>
        </section>
      </div>

      <CompanyBlock />
    </section>
  )
}

export default RentPage
