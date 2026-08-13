import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="panel empty-state">
      <strong>Không tìm thấy trang</strong>
      <Link className="primary-button" to="/">
        Về tổng quan
      </Link>
    </div>
  )
}
