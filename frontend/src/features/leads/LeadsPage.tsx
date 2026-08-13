import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { api, fmtDate, fmtMoney } from '../../lib/api'
import type { Lead, LeadStatus } from '../../types'

const empty={customer_name:'',phone:'',budget_min:'',budget_max:'',interested_brand:'',interested_model:'',status:'new',follow_up_date:'',notes:''}

export function LeadsPage(){
  const [items,setItems]=useState<Lead[]>([]);const [search,setSearch]=useState('');const [open,setOpen]=useState(false);const [form,setForm]=useState(empty);const [error,setError]=useState('')
  const load=async()=>{try{setItems(await api<Lead[]>(`/leads${search.trim()?`?search=${encodeURIComponent(search.trim())}`:''}`))}catch(err){setError((err as Error).message)}}
  useEffect(()=>{void load()},[])
  const create=async(e:React.FormEvent)=>{e.preventDefault();try{await api('/leads',{method:'POST',body:JSON.stringify({customer_name:form.customer_name,phone:form.phone,budget_min:form.budget_min?Number(form.budget_min):null,budget_max:form.budget_max?Number(form.budget_max):null,interested_brand:form.interested_brand||null,interested_model:form.interested_model||null,status:form.status,follow_up_date:form.follow_up_date||null,notes:form.notes||null})});setForm(empty);setOpen(false);await load()}catch(err){setError((err as Error).message)}}
  const updateStatus=async(id:string,status:LeadStatus)=>{try{await api(`/leads/${id}`,{method:'PATCH',body:JSON.stringify({status})});await load()}catch(err){setError((err as Error).message)}}
  return <>
    <PageHeader title="Khách đang quan tâm" subtitle="" actions={<button className="primary-button" onClick={()=>setOpen(true)}><Plus size={17}/> Thêm khách quan tâm</button>}/>
    {error&&<div className="error-banner">{error}</div>}
    <Modal open={open} title="Thêm khách đang quan tâm" onClose={()=>setOpen(false)}><form className="form-grid" onSubmit={create}><label>Họ tên<input required value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})}/></label><label>SĐT<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label><label>Ngân sách từ<input type="number" value={form.budget_min} onChange={e=>setForm({...form,budget_min:e.target.value})}/></label><label>Đến<input type="number" value={form.budget_max} onChange={e=>setForm({...form,budget_max:e.target.value})}/></label><label>Hãng quan tâm<input value={form.interested_brand} onChange={e=>setForm({...form,interested_brand:e.target.value})}/></label><label>Model<input value={form.interested_model} onChange={e=>setForm({...form,interested_model:e.target.value})}/></label><label>Trạng thái<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="new">Mới</option><option value="contacted">Đã liên hệ</option><option value="visited">Đã ghé shop</option><option value="considering">Đang cân nhắc</option></select></label><label>Ngày gọi lại<input type="date" value={form.follow_up_date} onChange={e=>setForm({...form,follow_up_date:e.target.value})}/></label><label className="span-2">Ghi chú<textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label><div className="form-actions span-2"><button type="button" className="secondary-button" onClick={()=>setOpen(false)}>Hủy</button><button className="primary-button">Lưu</button></div></form></Modal>
  </>
}
