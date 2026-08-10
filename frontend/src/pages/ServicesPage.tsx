import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { api, fmtDate } from '../lib/api'
import type { Customer, Piano, Sale, ServiceRecord, ServiceStatus } from '../types'

export function ServicesPage() {
  const [items, setItems] = useState<ServiceRecord[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pianos, setPianos] = useState<Piano[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customer_id: '',
    piano_id: '',
    service_date: new Date().toISOString().slice(0, 10),
    service_type: 'Bảo trì định kỳ',
    description: '',
    next_service_date: '',
    status: 'scheduled',
    notes: '',
  })

  const load = async () => {
    try {
      const [serviceRows, customerRows, pianoRows, saleRows] = await Promise.all([
        api<ServiceRecord[]>('/services'),
        api<Customer[]>('/customers'),
        api<Piano[]>('/pianos?status=sold'),
        api<Sale[]>('/sales'),
      ])
      setItems(serviceRows)
      setCustomers(customerRows)
      setPianos(pianoRows)
      setSales(saleRows)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => { void load() }, [])

  const customerPianos = useMemo(() => {
    const pianoIds = new Set(sales.filter((sale) => sale.customer_id === form.customer_id).map((sale) => sale.piano_id))
    return pianos.filter((piano) => pianoIds.has(piano.id))
  }, [form.customer_id, pianos, sales])


  const updateStatus = async (id: string, status: ServiceStatus) => {
    try {
      await api(`/services/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await api('/services', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          description: form.description || null,
          next_service_date: form.next_service_date || null,
          notes: form.notes || null,
        }),
      })
      setOpen(false)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return <>
    <PageHeader
      title="Bảo trì & sửa chữa"
      subtitle="Giữ lịch sử từng cây đàn và biết khách nào đến lịch chăm sóc."
      actions={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={17}/> Thêm lịch</button>}
    />
    {error && <div className="error-banner">{error}</div>}
    <div className="panel compact-panel">
      {items.length === 0 ? <EmptyState title="Chưa có lịch bảo trì" description="Tạo lịch sau bán để shop dễ chăm sóc khách cũ."/> : <div className="table-scroll"><table><thead><tr><th>Khách</th><th>Đàn</th><th>Ngày</th><th>Nội dung</th><th>Lần tiếp theo</th><th>Trạng thái</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.customer_name}</strong><div className="subtext">{item.customer_phone}</div></td><td>{item.piano_name}<div className="subtext mono">{item.serial_number}</div></td><td>{fmtDate(item.service_date)}</td><td>{item.service_type}<div className="subtext">{item.description || ''}</div></td><td>{fmtDate(item.next_service_date)}</td><td><select className="mini-select" value={item.status} onChange={(e)=>void updateStatus(item.id,e.target.value as ServiceStatus)}><option value="scheduled">Đã hẹn</option><option value="in_progress">Đang xử lý</option><option value="completed">Hoàn tất</option><option value="cancelled">Đã hủy</option></select></td></tr>)}</tbody></table></div>}
    </div>
    <Modal open={open} title="Thêm lịch bảo trì" onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={create}>
        <label>Khách
          <select required value={form.customer_id} onChange={(e) => setForm({...form, customer_id:e.target.value, piano_id:''})}>
            <option value="">Chọn khách</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</option>)}
          </select>
        </label>
        <label>Đàn khách đã mua
          <select required disabled={!form.customer_id} value={form.piano_id} onChange={(e) => setForm({...form, piano_id:e.target.value})}>
            <option value="">{form.customer_id ? 'Chọn đàn' : 'Chọn khách trước'}</option>
            {customerPianos.map((piano) => <option key={piano.id} value={piano.id}>{piano.brand} {piano.model} · {piano.serial_number}</option>)}
          </select>
        </label>
        <label>Ngày bảo trì<input type="date" required value={form.service_date} onChange={(e) => setForm({...form, service_date:e.target.value})}/></label>
        <label>Loại công việc<input required value={form.service_type} onChange={(e) => setForm({...form, service_type:e.target.value})}/></label>
        <label className="span-2">Mô tả<textarea rows={3} value={form.description} onChange={(e) => setForm({...form, description:e.target.value})}/></label>
        <label>Lịch tiếp theo<input type="date" value={form.next_service_date} onChange={(e) => setForm({...form, next_service_date:e.target.value})}/></label>
        <label>Trạng thái<select value={form.status} onChange={(e) => setForm({...form, status:e.target.value})}><option value="scheduled">Đã hẹn</option><option value="in_progress">Đang xử lý</option><option value="completed">Hoàn tất</option><option value="cancelled">Đã hủy</option></select></label>
        <div className="form-actions span-2"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Hủy</button><button className="primary-button">Lưu lịch</button></div>
      </form>
    </Modal>
  </>
}
