import {
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
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

import { useRole } from '../../contexts/RoleContext'

const nav = [
  { to: '/', label: 'Tổng quan', icon: Gauge },
  { to: '/customers', label: 'Khách hàng', icon: Users },
  { to: '/pianos', label: 'Đàn', icon: Piano },
  { to: '/sales', label: 'Bán hàng', icon: ShoppingBag },
  { to: '/warranties', label: 'Bảo hành', icon: ShieldCheck },
  { to: '/services', label: 'Bảo trì', icon: Wrench },
  { to: '/leads', label: 'Khách tiềm năng', icon: ClipboardList },
  { to: '/assistant', label: 'Trợ lý AI', icon: Bot },
]

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')

  const { label } = useRole()
  const navigate = useNavigate()

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()

    const value = query.trim()
    if (!value) return

    navigate(`/search?q=${encodeURIComponent(value)}`)
    setMobileOpen(false)
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Đóng menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">PS</div>

            <div className="sidebar-brand-text">
              <strong>Piano Solna</strong>
              <span>Quản lý cửa hàng</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-collapse-button"
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <ChevronLeft size={17} />
            )}
          </button>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ to, label: itemLabel, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              data-tooltip={itemLabel}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-nav-icon">
                <Icon size={20} strokeWidth={1.8} />
              </span>

              <span className="sidebar-nav-label">{itemLabel}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {label.charAt(0).toUpperCase()}
          </div>

          <div className="sidebar-user-info">
            <strong>{label}</strong>
            <span>Chủ shop</span>
          </div>

          <ChevronRight size={16} className="sidebar-user-arrow" />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu"
            aria-label="Mở menu"
            onClick={() => setMobileOpen((value) => !value)}
          >
            <Menu size={20} />
          </button>

          <form className="global-search" onSubmit={submitSearch}>
            <Search size={17} />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm khách, đàn, serial, số điện thoại..."
            />
          </form>

          <div className="topbar-actions">
            <button
              type="button"
              className="icon-button"
              aria-label="Thông báo"
            >
              <Bell size={18} />
            </button>

            <div className="role-switch">
              <button type="button" className="selected">
                Chủ shop
              </button>
            </div>

            <div className="avatar">{label.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
