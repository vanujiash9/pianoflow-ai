import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { api, fmtDate } from '../lib/api'
import type { Customer, Piano, Sale } from '../types'

export function SalesPage(){
  const [sales,setSales]=useState<Sale[]>([]); const [customers,setCustomers]=useState<Customer[]>([]); const [pianos,setPianos]=useState<Piano[]>([]); const [open,setOpen]=useState(false); const [error,setError]=useState('')
  const [form,setForm]=useState({customer_id:'',piano_id:'',sale_date:new Date().toISOString().slice(0,10),warranty_months:'12',notes:''})
  const load=async()=>{try{const [s,c,p]=await Promise.all([api<Sale[]>('/sales'),api<Customer[]>('/customers'),api<Piano[]>('/pianos?status=available')]);setSales(s);setCustomers(c);setPianos(p)}catch(err){setError((err as Error).message)}}
  useEffect(()=>{void load()},[])
  const create=async(e:React.FormEvent)=>{e.preventDefault();try{await api('/sales',{method:'POST',body:JSON.stringify({...form,warranty_months:Number(form.warranty_months),notes:form.notes||null})});setOpen(false);await load()}catch(err){setError((err as Error).message)}}
  return <>
    <PageHeader title="Bán hàng" subtitle="Gắn khách với đúng cây đàn; hệ thống tự tạo thời hạn bảo hành." actions={<button className="primary-button" onClick={()=>setOpen(true)}><Plus size={17}/> Ghi nhận bán đàn</button>}/>
    {error&&<div className="error-banner">{error}</div>}
    <div className="panel compact-panel">{sales.length===0?<EmptyState title="Chưa có giao dịch" description="Khi bán đàn, ghi nhận tại đây để theo dõi bảo hành về sau."/>:<div className="table-scroll"><table><thead><tr><th>Ngày bán</th><th>Khách</th><th>Đàn</th><th>Serial</th><th>Bảo hành đến</th><th>Ghi chú</th></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td>{fmtDate(s.sale_date)}</td><td><strong>{s.customer_name}</strong><div className="subtext">{s.customer_phone}</div></td><td>{s.piano_name}</td><td className="mono">{s.serial_number}</td><td>{fmtDate(s.warranty_end_date)}</td><td>{s.notes||'—'}</td></tr>)}</tbody></table></div>}</div>
    <Modal open={open} title="Ghi nhận bán đàn" onClose={()=>setOpen(false)}><form className="form-grid" onSubmit={create}><label>Khách hàng<select required value={form.customer_id} onChange={e=>setForm({...form,customer_id:e.target.value})}><option value="">Chọn khách</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}</select></label><label>Đàn<select required value={form.piano_id} onChange={e=>setForm({...form,piano_id:e.target.value})}><option value="">Chọn đàn còn tại shop</option>{pianos.map(p=><option key={p.id} value={p.id}>{p.brand} {p.model} · {p.serial_number}</option>)}</select></label><label>Ngày bán<input type="date" required value={form.sale_date} onChange={e=>setForm({...form,sale_date:e.target.value})}/></label><label>Bảo hành (tháng)<input type="number" min="0" max="120" required value={form.warranty_months} onChange={e=>setForm({...form,warranty_months:e.target.value})}/></label><label className="span-2">Ghi chú<textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><div className="form-actions span-2"><button type="button" className="secondary-button" onClick={()=>setOpen(false)}>Hủy</button><button className="primary-button">Xác nhận bán đàn</button></div></form></Modal>
  </>
}
