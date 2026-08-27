import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ProtectedLayout } from './components/layout/ProtectedLayout'
import { RoleProvider } from './contexts/RoleContext'
import { AuthProvider } from './contexts/AuthContext'
import { AssistantProvider } from './features/assistant/AssistantContext'
import { AssistantPage } from './features/assistant/AssistantPage'
import { AuthPage } from './features/auth/AuthPage'
import { CustomersPage } from './features/customers/CustomersPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LeadsPage } from './features/leads/LeadsPage'
import { NotFoundPage } from './features/common/NotFoundPage'
import { SalesPage } from './features/sales-warranty/SalesPage'
import { SearchPage } from './features/inventory/SearchPage'
import { WarrantiesPage } from './features/sales-warranty/WarrantiesPage'
import { WarrantiesPrintPage } from './features/sales-warranty/WarrantiesPrintPage'

const authRoutes = [{ path: '/login', element: <AuthPage /> }] as const

const protectedRoutes = [
  { path: '/', element: <DashboardPage /> },
  { path: '/customers', element: <CustomersPage /> },
  { path: '/customers/:customerId', element: <CustomersPage /> },
  { path: '/search', element: <SearchPage /> },
  { path: '/sales', element: <SalesPage /> },
  { path: '/warranties', element: <WarrantiesPage /> },
  { path: '/warranties/print', element: <WarrantiesPrintPage /> },
  { path: '/leads', element: <LeadsPage /> },
  { path: '/assistant', element: <AssistantPage /> },
] as const

export default function App() {
  return (
    <RoleProvider>
      <AuthProvider>
        <BrowserRouter>
          <AssistantProvider>
            <Routes>
              {authRoutes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
              <Route element={<ProtectedLayout />}>
                {protectedRoutes.map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </AssistantProvider>
        </BrowserRouter>
      </AuthProvider>
    </RoleProvider>
  )
}
