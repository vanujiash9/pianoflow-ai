import { Printer, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { api, fmtDate } from '../lib/api'
import type { Warranty } from '../types'

export function WarrantiesPage(){
  const [items,setItems]=useState<Warranty[]>([]); const [error,setError]=useState('')
  const navigate = useNavigate()
  useEffect(()=>{api<Warranty[]>('/warranties').then(setItems).catch((e:Error)=>setError(e.message))},[])
  return <>
    <PageHeader title="Bảo hành" subtitle="Tra nhanh khách, cây đàn và thời hạn bảo hành theo từng giao dịch." actions={<><div className="soft-pill"><ShieldCheck size={16}/> {items.filter(i=>i.status==='expiring').length} sắp hết hạn</div><button type="button" className="secondary-button print-hide" onClick={()=>navigate('/warranties/print')}><Printer size={16}/> Mẫu in A4</button></>}/>
    {error&&<div className="error-banner">{error}</div>}
    <div className="panel compact-panel warranty-sheet">{items.length===0?<EmptyState title="Chưa có bảo hành" description="Bảo hành được tạo tự động khi ghi nhận bán đàn."/>:<div className="table-scroll"><table><thead><tr><th>Khách</th><th>Đàn</th><th>Serial</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td><strong>{i.customer_name}</strong><div className="subtext">{i.customer_phone}</div></td><td>{i.piano_name}</td><td className="mono">{i.serial_number}</td><td>{fmtDate(i.start_date)}</td><td>{fmtDate(i.end_date)}</td><td><StatusBadge value={i.status}/></td></tr>)}</tbody></table></div>}</div>
  </>
}
