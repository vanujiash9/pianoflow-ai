import {
  Bell,
  Bot,
  Boxes,
  ClipboardList,
  Gauge,
  Menu,
  Piano,
  Search,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'

const nav = [
  { to: '/', label: 'Tổng quan', icon: Gauge },
  { to: '/customers', label: 'Khách hàng', icon: Users },
  { to: '/pianos', label: 'Đàn', icon: Piano },
  { to: '/sales', label: 'Bán hàng', icon: ShoppingBag },
  { to: '/warranties', label: 'Bảo hành', icon: ShieldCheck },
  { to: '/services', label: 'Bảo trì', icon: Wrench },
  { to: '/leads', label: 'Khách quan tâm', icon: ClipboardList },
  { to: '/assistant', label: 'Trợ lý AI', icon: Bot },
]

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { role, setRole, label } = useRole()
  const navigate = useNavigate()

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setMobileOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Piano size={22} />
          </div>
          <div>
            <strong>PianoFlow</strong>
            <span>Shop workspace</span>
          </div>
        </div>
        <nav>
          {nav.map(({ to, label: itemLabel, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobileOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
              <Icon size={18} /><span>{itemLabel}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-card"><Boxes size={17} /><div><strong>Dữ liệu nhỏ, dễ kiểm soát</strong><span>Ưu tiên thao tác nhanh tại shop.</span></div></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen((value) => !value)}><Menu size={20} /></button>
          <form className="global-search" onSubmit={submitSearch}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm khách, SĐT, model hoặc serial..." /></form>
          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="Thông báo">
              <Bell size={18} />
            </button>
            <div className="role-switch">
              <button type="button" className={role === 'owner' ? 'selected' : ''} onClick={() => setRole('owner')}>Chủ shop</button>
              <button type="button" className={role === 'staff' ? 'selected' : ''} onClick={() => setRole('staff')}>Nhân viên</button>
            </div>
            <div className="avatar">{label.charAt(0)}</div>
          </div>
        </header>
        <div className="page-container"><Outlet /></div>
      </main>
    </div>
  )
}
