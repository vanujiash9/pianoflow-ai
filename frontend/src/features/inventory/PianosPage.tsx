import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { api } from '../../lib/api'
import type { Piano, PianoStatus } from '../../types'

const emptyForm = { brand:'', model:'', serial_number:'', year:'', color:'Đen', condition:'used', notes:'' }

export function PianosPage() {
  const [items, setItems] = useState<Piano[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PianoStatus | ''>('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const qs = new URLSearchParams(); if(search.trim()) qs.set('search',search.trim()); if(status) qs.set('status',status)
      setItems(await api<Piano[]>(`/pianos${qs.toString()?`?${qs}`:''}`))
    } catch(err){setError((err as Error).message)}
  }
  useEffect(()=>{void load()},[status])

  const updateStatus = async (id: string, nextStatus: PianoStatus) => {
    try {
      await api(`/pianos/${id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) })
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const create = async (event:React.FormEvent)=>{
    event.preventDefault()
    try{
      await api('/pianos',{method:'POST',body:JSON.stringify({brand:form.brand.trim(),model:form.model.trim(),serial_number:form.serial_number.trim().toUpperCase()||null,year:form.year?Number(form.year):null,color:form.color.trim()||null,condition:form.condition,status:'available',notes:form.notes.trim()||null})})
      setOpen(false);setForm(emptyForm);await load()
    }catch(err){setError((err as Error).message)}
  }

  return <>
    <PageHeader title="Đàn tại shop" subtitle="" actions={<button className="primary-button" onClick={()=>setOpen(true)}><Plus size={17}/> Thêm đàn</button>}/>
    {error&&<div className="error-banner">{error}</div>}
    <div className="panel"><div className="toolbar compact"><form className="inline-search" onSubmit={(e)=>{e.preventDefault();void load()}}><Search size={17}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Hãng, model hoặc serial"/><button>Tìm</button></form><select value={status} onChange={(e)=>setStatus(e.target.value as PianoStatus|'')}><option value="">Tất cả trạng thái</option><option value="available">Còn tại shop</option><option value="reserved">Đang giữ</option><option value="sold">Đã bán</option><option value="service">Đang bảo trì</option></select></div>
      {items.length===0?<div className="pianos-empty-state">Chưa có đàn</div>:<div className="table-scroll"><table><thead><tr><th>Đàn</th><th>Serial</th><th>Năm</th><th>Tình trạng</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>{items.map((p)=><tr key={p.id}><td><strong>{p.brand} {p.model}</strong><div className="subtext">{p.color||'—'}</div></td><td className="mono">{p.serial_number}</td><td>{p.year||'—'}</td><td>{p.condition==='used'?'Đã qua sử dụng':'Mới'}</td><td>{p.status==='sold'?<StatusBadge value={p.status}/>:<select className="mini-select" value={p.status} onChange={(e)=>void updateStatus(p.id,e.target.value as PianoStatus)}><option value="available">Còn tại shop</option><option value="reserved">Đang giữ</option><option value="service">Đang bảo trì</option></select>}</td><td className="notes-cell">{p.notes||'—'}</td></tr>)}</tbody></table></div>}
    </div>
    <Modal open={open} title="Thêm đàn" onClose={()=>setOpen(false)}><form className="form-grid" onSubmit={create}><label>Hãng<input required value={form.brand} onChange={(e)=>setForm({...form,brand:e.target.value})}/></label><label>Model<input required value={form.model} onChange={(e)=>setForm({...form,model:e.target.value})}/></label><label>Serial<input required value={form.serial_number} onChange={(e)=>setForm({...form,serial_number:e.target.value})}/></label><label>Năm sản xuất<input type="number" value={form.year} onChange={(e)=>setForm({...form,year:e.target.value})}/></label><label>Màu<input value={form.color} onChange={(e)=>setForm({...form,color:e.target.value})}/></label><label>Tình trạng<select value={form.condition} onChange={(e)=>setForm({...form,condition:e.target.value})}><option value="used">Đã qua sử dụng</option><option value="new">Mới</option></select></label><label className="span-2">Ghi chú<textarea rows={3} value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/></label><div className="form-actions span-2"><button type="button" className="secondary-button" onClick={()=>setOpen(false)}>Hủy</button><button className="primary-button">Lưu đàn</button></div></form></Modal>
  </>
}
