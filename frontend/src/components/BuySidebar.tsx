import { brandOptions, colorOptions, fuelOptions } from '../constants/cars'

type BuySidebarProps = {
  brand: string
  modelFilter: string
  models: string[]
  priceMax: string
  yearMin: string
  yearMax: string
  mileageMax: string
  fuelType: string
  colorFilter: string
  carsCount: number
  goHome: () => void
  updateBrand: (value: string) => void
  updateModel: (value: string) => void
  updatePriceMax: (value: string) => void
  updateYearRange: (min: string, max: string) => void
  updateMileage: (value: string) => void
  updateFuel: (value: string) => void
  setColorFilter: (value: string) => void
  showNotice: (message: string) => void
}

function FilterButton({
  label,
  value,
  currentValue,
  onSelect,
}: {
  label: string
  value: string
  currentValue: string
  onSelect: (value: string) => void
}) {
  return (
    <button
      type="button"
      className={currentValue === value ? 'filter-option active' : 'filter-option'}
      onClick={() => onSelect(currentValue === value ? '' : value)}
    >
      {label}
    </button>
  )
}

function BuySidebar({
  brand,
  modelFilter,
  models,
  priceMax,
  yearMin,
  yearMax,
  mileageMax,
  fuelType,
  colorFilter,
  carsCount,
  goHome,
  updateBrand,
  updateModel,
  updatePriceMax,
  updateYearRange,
  updateMileage,
  updateFuel,
  setColorFilter,
  showNotice,
}: BuySidebarProps) {
  return (
    <aside className="buy-sidebar">
      <div className="filter-title">
        <h2>Filters</h2>
        <button type="button" onClick={goHome}>Clear all filters</button>
      </div>

      <section>
        <h3>Brand</h3>
        <div className="filter-options">
          {brandOptions.map((item) => (
            <FilterButton key={item} label={item} value={item} currentValue={brand} onSelect={updateBrand} />
          ))}
        </div>
      </section>

      <section>
        <h3>Model</h3>
        <select value={modelFilter} onChange={(event) => updateModel(event.target.value)}>
          <option value="">All models</option>
          {models.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </section>

      <section>
        <h3>Price</h3>
        <div className="range-labels">
          <span>10,000$</span>
          <span>{Number(priceMax).toLocaleString('en-US')}$+</span>
        </div>
        <input
          type="range"
          min="10000"
          max="200000"
          step="5000"
          value={priceMax}
          onChange={(event) => updatePriceMax(event.target.value)}
        />
      </section>

      <section>
        <h3>Year</h3>
        <div className="dual-select">
          <label>
            From
            <select value={yearMin} onChange={(event) => updateYearRange(event.target.value, yearMax)}>
              {['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          <label>
            To
            <select value={yearMax} onChange={(event) => updateYearRange(yearMin, event.target.value)}>
              {['2018', '2019', '2020', '2021', '2022', '2023', '2024'].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section>
        <h3>Mileage</h3>
        <select value={mileageMax} onChange={(event) => updateMileage(event.target.value)}>
          <option value="">Any mileage</option>
          <option value="30000">Up to 30,000 mi</option>
          <option value="60000">Up to 60,000 mi</option>
          <option value="100000">Up to 100,000 mi</option>
        </select>
      </section>

      <section>
        <h3>Fuel type</h3>
        <div className="filter-options">
          {fuelOptions.map((item) => (
            <FilterButton
              key={item}
              label={item[0].toUpperCase() + item.slice(1)}
              value={item}
              currentValue={fuelType}
              onSelect={updateFuel}
            />
          ))}
        </div>
      </section>

      <section>
        <h3>Color</h3>
        <div className="filter-options">
          {colorOptions.map((item) => (
            <FilterButton key={item} label={item} value={item} currentValue={colorFilter} onSelect={setColorFilter} />
          ))}
        </div>
      </section>

      <button className="show-cars-button" type="button" onClick={() => showNotice(`${carsCount} cars loaded`)}>
        Show {carsCount} cars
      </button>
    </aside>
  )
}

export default BuySidebar
