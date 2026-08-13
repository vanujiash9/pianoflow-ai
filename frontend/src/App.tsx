import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { RoleProvider } from './contexts/RoleContext'
import { AssistantProvider } from './features/assistant/AssistantContext'
import { AssistantPage } from './features/assistant/AssistantPage'
import { CustomersPage } from './features/customers/CustomersPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LeadsPage } from './features/leads/LeadsPage'
import { NotFoundPage } from './features/common/NotFoundPage'
import { PianosPage } from './features/inventory/PianosPage'
import { SalesPage } from './features/sales-warranty/SalesPage'
import { SearchPage } from './features/inventory/SearchPage'
import { ServicesPage } from './features/maintenance/services/ServicesPage'
import { WarrantiesPage } from './features/sales-warranty/WarrantiesPage'
import { WarrantiesPrintPage } from './features/sales-warranty/WarrantiesPrintPage'

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <AssistantProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route
                path="/customers/:customerId"
                element={<CustomersPage />}
              />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/pianos" element={<PianosPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/warranties" element={<WarrantiesPage />} />
              <Route path="/warranties/print" element={<WarrantiesPrintPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AssistantProvider>
      </BrowserRouter>
    </RoleProvider>
  )
}
