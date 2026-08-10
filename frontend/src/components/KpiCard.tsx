import type { LucideIcon } from 'lucide-react'

export function KpiCard({ label, value, helper, icon: Icon, tone = 'blue' }: { label: string; value: number | string; helper: string; icon: LucideIcon; tone?: 'blue' | 'green' | 'amber' | 'violet' }) {
  return (
    <div className={`kpi-card tone-${tone}`}>
      <div className="kpi-icon"><Icon size={19} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </div>
  )
}
