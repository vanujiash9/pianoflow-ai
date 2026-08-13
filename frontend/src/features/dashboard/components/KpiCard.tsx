import type { CSSProperties, KeyboardEvent } from 'react'
import { ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: number | string
  helper: string
  icon: LucideIcon
  tone?: 'blue' | 'green' | 'amber' | 'violet'
  onClick?: () => void
}

const cardStyle: CSSProperties = {
  minWidth: 0,
  height: '100%',
  boxSizing: 'border-box',

  display: 'grid',
  gridTemplateColumns: '40px minmax(0, 1fr) 18px',
  gap: 12,
  alignItems: 'center',

  padding: '13px 14px',

  border: '1px solid #e7eaf1',
  borderRadius: 15,

  background: '#fff',
}

const contentStyle: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
}

const labelStyle: CSSProperties = {
  marginBottom: 1,

  color: '#7d879a',
  fontSize: 11.5,
  fontWeight: 500,
}

const helperStyle: CSSProperties = {
  marginTop: 4,

  color: '#9aa3b3',
  fontSize: 10.5,
  lineHeight: 1.2,

  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const valueStyle: CSSProperties = {
  color: '#111827',

  fontSize: 25,
  lineHeight: 1.05,
  fontWeight: 750,

  letterSpacing: '-0.02em',
}

export function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'blue',
  onClick,
}: KpiCardProps) {
  const handleKeyboard = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (!onClick) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={`kpi-card tone-${tone}`}
      style={{
        ...cardStyle,
        cursor: onClick ? 'pointer' : 'default',
        transition:
          'border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
      }}
      onClick={onClick}
      onKeyDown={handleKeyboard}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div
        className="kpi-icon"
        style={{
          width: 40,
          height: 40,
          margin: 0,

          display: 'grid',
          placeItems: 'center',

          borderRadius: 12,
        }}
      >
        <Icon size={18} strokeWidth={2} />
      </div>

      <div style={contentStyle}>
        <span style={labelStyle}>{label}</span>

        <strong style={valueStyle}>{value}</strong>

        <small style={helperStyle}>{helper}</small>
      </div>

      {onClick ? (
        <ChevronRight
          size={16}
          strokeWidth={1.8}
          style={{
            color: '#b1b8c6',
          }}
        />
      ) : (
        <span />
      )}
    </div>
  )
}
