import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Role = 'owner' | 'staff'

type RoleContextValue = {
  role: Role
  setRole: (role: Role) => void
  label: string
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    if (typeof window === 'undefined') return 'owner'
    const storedRole = localStorage.getItem('pianoflow-role')
    return storedRole === 'staff' ? 'staff' : 'owner'
  })
  const setRole = (next: Role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pianoflow-role', next)
    }
    setRoleState(next)
  }
  const value = useMemo(() => ({ role, setRole, label: role === 'owner' ? 'Chủ shop' : 'Nhân viên' }), [role])
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (!context) throw new Error('useRole must be used inside RoleProvider')
  return context
}
