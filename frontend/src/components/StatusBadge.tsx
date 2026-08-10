const labels: Record<string, string> = {
  available: 'Còn tại shop', reserved: 'Đang giữ', sold: 'Đã bán', service: 'Đang bảo trì',
  active: 'Còn hạn', expiring: 'Sắp hết hạn', expired: 'Hết hạn', voided: 'Đã hủy',
  new: 'Mới', contacted: 'Đã liên hệ', visited: 'Đã ghé shop', considering: 'Đang cân nhắc', won: 'Đã mua', lost: 'Không tiếp tục',
  scheduled: 'Đã hẹn', in_progress: 'Đang xử lý', completed: 'Hoàn tất', cancelled: 'Đã hủy',
}

export function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-${value}`}>{labels[value] || value}</span>
}
