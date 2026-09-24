import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { API_URL, parseApiError } from '../api/client'
import type { Car, CarsResponse } from '../types/cars'
import { carTitle, fallbackImage, formatMileage, formatPrice } from '../utils/cars'

type ComparePageProps = {
  openCar: (car: Car) => void
  openBuy: () => void
}

type CompareMetric = {
  label: string
  hint: string
  value: (car: Car) => string
  score?: (car: Car) => number
  best?: 'min' | 'max'
}

const MAX_COMPARE_CARS = 4

const compareMetrics: CompareMetric[] = [
  {
    label: 'Price',
    hint: 'Lower purchase price is highlighted.',
    value: (car) => formatPrice(car.price),
    score: (car) => Number(car.price),
    best: 'min',
  },
  {
    label: 'Year',
    hint: 'Newer year is highlighted.',
    value: (car) => String(car.year),
    score: (car) => car.year,
    best: 'max',
  },
  {
    label: 'Mileage',
    hint: 'Lower mileage is highlighted.',
    value: (car) => formatMileage(car.mileage),
    score: (car) => car.mileage,
    best: 'min',
  },
  {
    label: 'Fuel type',
    hint: 'Engine or powertrain type.',
    value: (car) => car.fuel_type || 'Not specified',
  },
  {
    label: 'Transmission',
    hint: 'Gearbox type.',
    value: (car) => car.transmission || 'Not specified',
  },
  {
    label: 'Body type',
    hint: 'Vehicle class.',
    value: (car) => car.body_type || 'Not specified',
  },
  {
    label: 'Condition',
    hint: 'Seller condition mark.',
    value: (car) => car.condition || 'Not specified',
  },
  {
    label: 'Color',
    hint: 'Listed exterior color.',
    value: (car) => car.color || 'Not specified',
  },
  {
    label: 'Rental price',
    hint: 'Lower daily rent is highlighted when available.',
    value: (car) => car.is_available_for_rent ? `$${Number(car.effective_rent_price_per_day).toLocaleString('en-US')}/day` : 'Not available',
    score: (car) => car.is_available_for_rent ? Number(car.effective_rent_price_per_day) : Number.POSITIVE_INFINITY,
    best: 'min',
  },
  {
    label: 'Rental deposit',
    hint: 'Deposit requested by seller.',
    value: (car) => car.is_available_for_rent ? formatPrice(car.rent_deposit || '0') : 'Not available',
  },
  {
    label: 'Seller city',
    hint: 'Where the seller is based.',
    value: (car) => car.seller?.city || 'Kyiv, Ukraine',
  },
  {
    label: 'Views',
    hint: 'Listing activity.',
    value: (car) => car.views_count.toLocaleString('en-US'),
    score: (car) => car.views_count,
    best: 'max',
  },
]

function shortText(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 120) {
    return normalized || 'No description'
  }

  return `${normalized.slice(0, 117)}...`
}

function ComparePage({ openCar, openBuy }: ComparePageProps) {
  const [catalogCars, setCatalogCars] = useState<Car[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isComparing, setIsComparing] = useState(false)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let isCurrent = true

    setIsLoading(true)
    setError('')

    fetch(`${API_URL}/cars/?page_size=50&ordering=-created_at`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) {
          throw data
        }

        return data as CarsResponse | Car[]
      })
      .then((data) => {
        if (!isCurrent) {
          return
        }

        const loadedCars = Array.isArray(data) ? data : data.results
        setCatalogCars(loadedCars)
      })
      .catch((requestError) => {
        if (!isCurrent) {
          return
        }

        if (requestError instanceof DOMException && requestError.name === 'AbortError') {
          return
        }

        setError(parseApiError(requestError))
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (catalogCars.length === 0) {
      setSelectedIds([])
      return
    }

    setSelectedIds((currentIds) => {
      const availableIds = new Set(catalogCars.map((car) => car.id))
      const safeIds = currentIds.filter((id) => availableIds.has(id)).slice(0, MAX_COMPARE_CARS)

      return safeIds
    })
  }, [catalogCars])

  const selectedCars = useMemo(
    () => selectedIds
      .map((id) => catalogCars.find((car) => car.id === id))
      .filter((car): car is Car => Boolean(car)),
    [catalogCars, selectedIds],
  )

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return catalogCars
    }

    return catalogCars.filter((car) => (
      [
        carTitle(car),
        car.brand,
        car.model,
        String(car.year),
        car.fuel_type,
        car.body_type,
        car.color,
      ].join(' ').toLowerCase().includes(query)
    ))
  }, [catalogCars, search])

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const tableStyle = { '--compare-columns': String(Math.max(1, selectedCars.length)) } as CSSProperties

  function selectCar(car: Car) {
    setMessage('')

    if (selectedIdSet.has(car.id)) {
      setSelectedIds((currentIds) => {
        const nextIds = currentIds.filter((id) => id !== car.id)
        if (nextIds.length <= 1) {
          setIsComparing(false)
        }

        return nextIds
      })
      return
    }

    if (selectedIds.length >= MAX_COMPARE_CARS) {
      setMessage('You can compare up to 4 cars. Remove one car before adding another.')
      return
    }

    setSelectedIds((currentIds) => [...currentIds, car.id])
    setIsComparing(false)
  }

  function clearSelectedCars() {
    setMessage('')
    setIsComparing(false)
    setSelectedIds([])
  }

  function showComparison() {
    if (selectedCars.length === 0) {
      setMessage('Select at least one car before comparing.')
      return
    }

    setMessage('')
    setIsComparing(true)
    window.setTimeout(() => {
      document.querySelector('.compare-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  function bestIdsForMetric(metric: CompareMetric) {
    if (!metric.score || !metric.best || selectedCars.length < 2) {
      return new Set<number>()
    }

    const scoredCars = selectedCars
      .map((car) => ({ car, score: metric.score?.(car) ?? Number.NaN }))
      .filter((item) => Number.isFinite(item.score))

    if (scoredCars.length < 2) {
      return new Set<number>()
    }

    const bestScore = metric.best === 'min'
      ? Math.min(...scoredCars.map((item) => item.score))
      : Math.max(...scoredCars.map((item) => item.score))

    return new Set(scoredCars.filter((item) => item.score === bestScore).map((item) => item.car.id))
  }

  return (
    <section className="compare-page">
      <section className="compare-hero">
        <div>
          <span>Vehicle comparison</span>
          <h1>Compare cars side by side</h1>
          <p>Choose cars manually, then compare price, mileage, year, rent terms and seller details in one table.</p>
        </div>
        <article>
          <strong>{selectedCars.length}/{MAX_COMPARE_CARS}</strong>
          <span>cars selected</span>
        </article>
      </section>

      <section className="compare-controls">
        <label>
          <span>Search cars</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by brand, model, fuel or year"
          />
        </label>
        <div>
          <button type="button" onClick={showComparison} disabled={selectedCars.length === 0}>
            Compare selected
          </button>
          <button type="button" onClick={clearSelectedCars} disabled={selectedCars.length === 0}>
            Clear
          </button>
        </div>
      </section>

      {isLoading && <p className="soft-note">Loading cars for comparison...</p>}
      {error && <p className="cars-error">{error}</p>}
      {message && <p className="compare-message">{message}</p>}

      <section className="compare-picker" aria-label="Choose cars to compare">
        {filteredCars.slice(0, 12).map((car) => {
          const isSelected = selectedIdSet.has(car.id)

          return (
            <article key={car.id} className={isSelected ? 'selected' : ''}>
              <button type="button" className="compare-picker-image" onClick={() => selectCar(car)}>
                <img src={fallbackImage(car)} alt={carTitle(car)} />
              </button>
              <div>
                <h2>{carTitle(car)}</h2>
                <p>{formatPrice(car.price)} | {formatMileage(car.mileage)} | {car.fuel_type}</p>
              </div>
              <button type="button" onClick={() => selectCar(car)}>
                {isSelected ? 'Remove' : 'Compare'}
              </button>
            </article>
          )
        })}
      </section>

      {!isLoading && filteredCars.length === 0 && (
        <div className="empty-state">
          <h3>No cars found</h3>
          <p>Try another brand, model or year.</p>
          <button type="button" onClick={() => setSearch('')}>Clear search</button>
        </div>
      )}

      <section className="compare-board">
        <div className="compare-board-head">
          <div>
            <h2>Comparison table</h2>
            <p>Select cars above and press Compare selected to build the table.</p>
          </div>
          <button type="button" onClick={openBuy}>Browse all cars</button>
        </div>

        {!isComparing ? (
          <div className="empty-state">
            <h3>Select cars first</h3>
            <p>Mark up to 4 cars from the list above, then press Compare selected.</p>
            <button type="button" onClick={showComparison} disabled={selectedCars.length === 0}>Compare selected</button>
          </div>
        ) : (
          <div className="compare-table-wrap">
            <div className="compare-table" style={tableStyle}>
              <div className="compare-row compare-car-row">
                <div className="compare-row-title">Vehicle</div>
                {selectedCars.map((car) => (
                  <article key={car.id} className="compare-car-summary">
                    <img src={fallbackImage(car)} alt={carTitle(car)} />
                    <h3>{carTitle(car)}</h3>
                    <p>{shortText(car.description)}</p>
                    <div>
                      <button type="button" onClick={() => openCar(car)}>Open listing</button>
                      <button type="button" onClick={() => selectCar(car)}>Remove</button>
                    </div>
                  </article>
                ))}
              </div>

              {compareMetrics.map((metric) => {
                const bestIds = bestIdsForMetric(metric)

                return (
                  <div key={metric.label} className="compare-row">
                    <div className="compare-row-title">
                      <strong>{metric.label}</strong>
                      <span>{metric.hint}</span>
                    </div>
                    {selectedCars.map((car) => (
                      <div key={car.id} className={bestIds.has(car.id) ? 'compare-value best' : 'compare-value'}>
                        {metric.value(car)}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </section>
  )
}

export default ComparePage
