import { X } from 'lucide-react'
import {
  type ReactNode,
  useEffect,
} from 'react'

import './drawer.css'

type DrawerProps = {
  open: boolean
  title: string
  subtitle?: string
  children: ReactNode
  onClose: () => void
}

export function Drawer({
  open,
  title,
  subtitle,
  children,
  onClose,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    )

    const oldOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      'hidden'

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      )

      document.body.style.overflow =
        oldOverflow
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div
      className="app-drawer-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <aside className="app-drawer">
        <header className="app-drawer-header">
          <div>
            <h2>{title}</h2>

            {subtitle && (
              <p>{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            className="app-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </header>

        <div className="app-drawer-content">
          {children}
        </div>
      </aside>
    </div>
  )
}