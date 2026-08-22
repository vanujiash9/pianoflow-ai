import { Link } from 'react-router-dom'

export function AuthNav() {
  return (
    <div className="auth-nav">
      <Link to="/login">Đăng nhập</Link>
      <Link to="/register">Đăng ký</Link>
    </div>
  )
}
