import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { api, fmtDate } from '../../lib/api'
import type { Customer, Piano, Sale } from '../../types'

interface SaleFormState {
  customer_id: string
  piano_id: string
  sale_date: string
  warranty_months: string
  notes: string
}

const initialFormState: SaleFormState = {
  customer_id: '',
  piano_id: '',
  sale_date: new Date().toISOString().slice(0, 10),
  warranty_months: '12',
  notes: '',
}

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pianos, setPianos] = useState<Piano[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<SaleFormState>(initialFormState)

  const load = async () => {
    try {
      const [salesData, customersData, pianosData] = await Promise.all([
        api<Sale[]>('/sales'),
        api<Customer[]>('/customers'),
        api<Piano[]>('/pianos?status=available'),
      ])
      setSales(salesData)
      setCustomers(customersData)
      setPianos(pianosData)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await api('/sales', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          warranty_months: Number(form.warranty_months),
          notes: form.notes || null,
        }),
      })
      setOpen(false)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <PageHeader
        title="Bán hàng"
        subtitle=""
        actions={
          <button type="button" className="primary-button" onClick={() => setOpen(true)}>
            <Plus size={17} /> Ghi nhận bán đàn
          </button>
        }
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="panel compact-panel">
        {sales.length === 0 ? (
          <div className="sales-empty-state">
            Chưa có giao dịch
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Ngày bán</th>
                  <th>Khách</th>
                  <th>Đàn</th>
                  <th>Serial</th>
                  <th>Bảo hành đến</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{fmtDate(sale.sale_date)}</td>
                    <td>
                      <strong>{sale.customer_name}</strong>
                      <div className="subtext">{sale.customer_phone}</div>
                    </td>
                    <td>{sale.piano_name}</td>
                    <td className="mono">{sale.serial_number}</td>
                    <td>{fmtDate(sale.warranty_end_date)}</td>
                    <td>{sale.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={open} title="Ghi nhận bán đàn" onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={create}>
          <label>
            Khách hàng
            <select
              required
              value={form.customer_id}
              onChange={(event) => setForm({ ...form, customer_id: event.target.value })}
            >
              <option value="">Chọn khách</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.phone}
                </option>
              ))}
            </select>
          </label>
          <label>
            Đàn
            <select required value={form.piano_id} onChange={(event) => setForm({ ...form, piano_id: event.target.value })}>
              <option value="">Chọn đàn còn tại shop</option>
              {pianos.map((piano) => (
                <option key={piano.id} value={piano.id}>
                  {piano.brand} {piano.model} · {piano.serial_number}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ngày bán
            <input type="date" required value={form.sale_date} onChange={(event) => setForm({ ...form, sale_date: event.target.value })} />
          </label>
          <label>
            Bảo hành (tháng)
            <input
              type="number"
              min="0"
              max="120"
              required
              value={form.warranty_months}
              onChange={(event) => setForm({ ...form, warranty_months: event.target.value })}
            />
          </label>
          <label className="span-2">
            Ghi chú
            <textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
          <div className="form-actions span-2">
            <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
              Hủy
            </button>
            <button className="primary-button">Xác nhận bán đàn</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
