import { Inbox } from 'lucide-react'

export function EmptyState({ title = 'Chưa có dữ liệu', description = 'Dữ liệu mới sẽ xuất hiện tại đây.' }: { title?: string; description?: string }) {
  return <div className="empty-state"><Inbox size={28} /><strong>{title}</strong><span>{description}</span></div>
}
