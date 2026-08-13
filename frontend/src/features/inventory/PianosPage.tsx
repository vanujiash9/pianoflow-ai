import {
  Filter,
  Piano as PianoIcon,
  Plus,
  Search,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import {
  api,
  getCachedResponse,
} from '../../lib/api'
import type {
  Piano,
  PianoStatus,
} from '../../types'

import './pianos.css'

const emptyForm = {
  brand: '',
  model: '',
  serial_number: '',
  year: '',
  color: 'Đen',
  condition: 'used',
  notes: '',
}

function buildPianosPath(
  search: string,
  status: PianoStatus | '',
) {
  const qs = new URLSearchParams()

  if (search.trim()) {
    qs.set('search', search.trim())
  }

  if (status) {
    qs.set('status', status)
  }

  const query = qs.toString()

  return `/pianos${query ? `?${query}` : ''}`
}

function conditionLabel(condition: string) {
  return condition === 'used'
    ? 'Đã qua sử dụng'
    : 'Mới'
}

export function PianosPage() {
  const [items, setItems] = useState<Piano[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] =
    useState<PianoStatus | ''>('')

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const path = useMemo(
    () => buildPianosPath(search, status),
    [search, status],
  )

  const load = async (refresh = false) => {
    const requestPath = buildPianosPath(
      search,
      status,
    )

    if (!refresh) {
      const cached =
        getCachedResponse<Piano[]>(
          requestPath,
        )

      if (cached) {
        setItems(cached.data)
      }
    }

    try {
      setLoading(true)
      setError('')

      const rows = await api<Piano[]>(
        requestPath,
      )

      setItems(rows)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải danh sách đàn.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const cached =
      getCachedResponse<Piano[]>(path)

    if (cached) {
      setItems(cached.data)
    }

    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const updateStatus = async (
    id: string,
    nextStatus: PianoStatus,
  ) => {
    try {
      setError('')

      await api(`/pianos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
        }),
      })

      await load(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật trạng thái.',
      )
    }
  }

  const create = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    try {
      setError('')

      await api('/pianos', {
        method: 'POST',
        body: JSON.stringify({
          brand: form.brand.trim(),
          model: form.model.trim(),

          serial_number:
            form.serial_number
              .trim()
              .toUpperCase() || null,

          year: form.year
            ? Number(form.year)
            : null,

          color:
            form.color.trim() || null,

          condition: form.condition,
          status: 'available',

          notes:
            form.notes.trim() || null,
        }),
      })

      setOpen(false)
      setForm(emptyForm)

      await load(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể thêm đàn.',
      )
    }
  }

  return (
    <div className="pianos-page">
      <PageHeader
        title="Đàn tại shop"
        subtitle=""
        actions={
          <button
            type="button"
            className="primary-button pianos-add-button"
            onClick={() => setOpen(true)}
          >
            <Plus size={17} />
            Thêm đàn
          </button>
        }
      />

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* SEARCH / FILTER */}
      <section className="pianos-toolbar-panel">
        <form
          className="pianos-search"
          onSubmit={(event) => {
            event.preventDefault()
            void load(true)
          }}
        >
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Tìm theo hãng, model hoặc serial"
          />

          <button
            type="submit"
            aria-label="Tìm đàn"
          >
            Tìm
          </button>
        </form>

        <div className="pianos-filter">
          <Filter size={16} />

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as
                  | PianoStatus
                  | '',
              )
            }
          >
            <option value="">
              Tất cả trạng thái
            </option>

            <option value="available">
              Còn tại shop
            </option>

            <option value="reserved">
              Đang giữ
            </option>

            <option value="sold">
              Đã bán
            </option>

            <option value="service">
              Đang bảo trì
            </option>
          </select>
        </div>
      </section>

      {/* TABLE */}
      <section className="pianos-table-panel">
        {items.length === 0 && loading ? (
          <div className="pianos-loading">
            Đang tải danh sách đàn...
          </div>
        ) : items.length === 0 ? (
          <div className="pianos-empty-state">
            <div className="pianos-empty-icon">
              <PianoIcon size={22} />
            </div>

            <strong>Chưa có đàn</strong>

            <span>
              Thêm cây đàn đầu tiên vào kho.
            </span>
          </div>
        ) : (
          <>
            <div className="pianos-table-scroll">
              <table className="pianos-table">
                <thead>
                  <tr>
                    <th>Đàn</th>
                    <th>Serial</th>
                    <th>Năm</th>
                    <th>Tình trạng</th>
                    <th>Trạng thái</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((piano) => (
                    <tr key={piano.id}>
                      <td>
                        <div className="pianos-product">
                          <div className="pianos-thumbnail">
                            <PianoIcon
                              size={25}
                              strokeWidth={1.5}
                            />
                          </div>

                          <div className="pianos-product-copy">
                            <strong>
                              {piano.brand}{' '}
                              {piano.model}
                            </strong>

                            <span>
                              {piano.color || '—'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="pianos-serial">
                          {piano.serial_number ||
                            '—'}
                        </span>
                      </td>

                      <td>
                        {piano.year || '—'}
                      </td>

                      <td>
                        <span
                          className={`pianos-condition ${
                            piano.condition ===
                            'used'
                              ? 'used'
                              : 'new'
                          }`}
                        >
                          {conditionLabel(
                            piano.condition,
                          )}
                        </span>
                      </td>

                      <td>
                        {piano.status ===
                        'sold' ? (
                          <StatusBadge
                            value={piano.status}
                          />
                        ) : (
                          <select
                            className={`pianos-status-select status-${piano.status}`}
                            value={piano.status}
                            onChange={(event) =>
                              void updateStatus(
                                piano.id,
                                event.target
                                  .value as PianoStatus,
                              )
                            }
                          >
                            <option value="available">
                              Còn tại shop
                            </option>

                            <option value="reserved">
                              Đang giữ
                            </option>

                            <option value="service">
                              Đang bảo trì
                            </option>
                          </select>
                        )}
                      </td>

                      <td>
                        <span className="pianos-note">
                          {piano.notes || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="pianos-table-footer">
              <span>
                Hiển thị {items.length}{' '}
                {items.length === 1
                  ? 'cây đàn'
                  : 'cây đàn'}
              </span>

              {loading && (
                <span className="pianos-refreshing">
                  Đang cập nhật...
                </span>
              )}
            </footer>
          </>
        )}
      </section>

      {/* CREATE */}
      <Modal
        open={open}
        title="Thêm đàn"
        onClose={() => setOpen(false)}
      >
        <form
          className="form-grid"
          onSubmit={create}
        >
          <label>
            Hãng
            <input
              required
              value={form.brand}
              onChange={(event) =>
                setForm({
                  ...form,
                  brand:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Model
            <input
              required
              value={form.model}
              onChange={(event) =>
                setForm({
                  ...form,
                  model:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Serial
            <input
              required
              value={
                form.serial_number
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  serial_number:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Năm sản xuất
            <input
              type="number"
              value={form.year}
              onChange={(event) =>
                setForm({
                  ...form,
                  year:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Màu
            <input
              value={form.color}
              onChange={(event) =>
                setForm({
                  ...form,
                  color:
                    event.target.value,
                })
              }
            />
          </label>

          <label>
            Tình trạng
            <select
              value={form.condition}
              onChange={(event) =>
                setForm({
                  ...form,
                  condition:
                    event.target.value,
                })
              }
            >
              <option value="used">
                Đã qua sử dụng
              </option>

              <option value="new">
                Mới
              </option>
            </select>
          </label>

          <label className="span-2">
            Ghi chú
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  notes:
                    event.target.value,
                })
              }
            />
          </label>

          <div className="form-actions span-2">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setOpen(false)
              }
            >
              Hủy
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              Lưu đàn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}