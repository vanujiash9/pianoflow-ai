import {
  ChevronRight,
  Piano,
  Search,
  UserRound,
} from 'lucide-react'
import {
  useEffect,
  useState,
} from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import {
  api,
  getCachedResponse,
} from '../../lib/api'
import type {
  Customer,
  Piano as PianoType,
} from '../../types'

import './search.css'

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return '?'

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`
    .toUpperCase()
}

export function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const query =
    params.get('q')?.trim() || ''

  const [customers, setCustomers] =
    useState<Customer[]>([])

  const [pianos, setPianos] =
    useState<PianoType[]>([])

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {
    if (!query) {
      setCustomers([])
      setPianos([])
      setLoading(false)
      return
    }

    const customerPath =
      `/customers?search=${encodeURIComponent(query)}`

    const pianoPath =
      `/pianos?search=${encodeURIComponent(query)}`

    const cachedCustomers =
      getCachedResponse<Customer[]>(
        customerPath,
      )

    const cachedPianos =
      getCachedResponse<PianoType[]>(
        pianoPath,
      )

    if (cachedCustomers) {
      setCustomers(
        cachedCustomers.data,
      )
    }

    if (cachedPianos) {
      setPianos(cachedPianos.data)
    }

    const hasCachedData =
      Boolean(cachedCustomers) &&
      Boolean(cachedPianos)

    if (!hasCachedData) {
      setLoading(true)
    }

    Promise.all([
      api<Customer[]>(
        customerPath,
      ),

      api<PianoType[]>(
        pianoPath,
      ),
    ])
      .then(
        ([
          customerRows,
          pianoRows,
        ]) => {
          setCustomers(customerRows)
          setPianos(pianoRows)
          setError('')
        },
      )
      .catch((err: Error) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [query])

  const openCustomer = (
    customer: Customer,
  ) => {
    navigate(`/customers/${customer.id}`)
  }

  const openPiano = (
    piano: PianoType,
  ) => {
    const pianoQuery =
      piano.serial_number ||
      `${piano.brand} ${piano.model}`

    navigate(
      `/pianos?search=${encodeURIComponent(
        pianoQuery,
      )}`,
    )
  }

  const totalResults =
    customers.length +
    pianos.length

  return (
    <div className="search-page">
      <PageHeader
        title="Tìm nhanh"
        subtitle={
          query
            ? `${totalResults} kết quả cho “${query}”`
            : 'Nhập từ khóa ở ô tìm kiếm phía trên.'
        }
      />

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading &&
      customers.length === 0 &&
      pianos.length === 0 ? (
        <div className="search-loading">
          <div className="search-loading-card" />
          <div className="search-loading-card" />
        </div>
      ) : (
        <div className="search-results-grid">
          {/* CUSTOMERS */}
          <section className="search-result-panel">
            <header className="search-result-header">
              <div className="search-result-heading">
                <span className="search-result-icon customer">
                  <UserRound
                    size={18}
                  />
                </span>

                <div>
                  <h2>
                    Khách hàng
                  </h2>

                  <span>
                    {customers.length}{' '}
                    kết quả
                  </span>
                </div>
              </div>
            </header>

            {customers.length ===
            0 ? (
              <div className="search-empty-state">
                <UserRound
                  size={23}
                />

                <strong>
                  Không tìm thấy khách
                </strong>

                <span>
                  Thử tìm theo tên hoặc
                  số điện thoại.
                </span>
              </div>
            ) : (
              <div className="search-result-list">
                {customers.map(
                  (customer) => (
                    <button
                      key={
                        customer.id
                      }
                      type="button"
                      className="search-result-row"
                      onClick={() =>
                        openCustomer(
                          customer,
                        )
                      }
                    >
                      <span className="search-customer-avatar">
                        {getInitials(
                          customer.name,
                        )}
                      </span>

                      <span className="search-result-main">
                        <strong>
                          {
                            customer.name
                          }
                        </strong>

                        <span>
                          {
                            customer.phone
                          }

                          <i>•</i>

                          {customer.address ||
                            'Chưa có địa chỉ'}
                        </span>
                      </span>

                      <ChevronRight
                        size={16}
                      />
                    </button>
                  ),
                )}
              </div>
            )}
          </section>

          {/* PIANOS */}
          <section className="search-result-panel">
            <header className="search-result-header">
              <div className="search-result-heading">
                <span className="search-result-icon piano">
                  <Piano size={18} />
                </span>

                <div>
                  <h2>Đàn</h2>

                  <span>
                    {pianos.length}{' '}
                    kết quả
                  </span>
                </div>
              </div>
            </header>

            {pianos.length === 0 ? (
              <div className="search-empty-state">
                <Piano size={24} />

                <strong>
                  Không tìm thấy đàn
                </strong>

                <span>
                  Thử tìm theo hãng,
                  model hoặc serial.
                </span>
              </div>
            ) : (
              <div className="search-result-list">
                {pianos.map(
                  (piano) => (
                    <button
                      key={piano.id}
                      type="button"
                      className="search-result-row"
                      onClick={() =>
                        openPiano(piano)
                      }
                    >
                      <span className="search-piano-icon">
                        <Piano
                          size={19}
                        />
                      </span>

                      <span className="search-result-main">
                        <strong>
                          {piano.brand}{' '}
                          {piano.model}
                        </strong>

                        <span>
                          {piano.serial_number ||
                            'Không có serial'}

                          <i>•</i>

                          {piano.year ||
                            'Chưa rõ năm'}
                        </span>
                      </span>

                      <StatusBadge
                        value={
                          piano.status
                        }
                      />

                      <ChevronRight
                        size={16}
                      />
                    </button>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}