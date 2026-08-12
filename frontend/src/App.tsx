import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RoleProvider } from './contexts/RoleContext'
import { AssistantPage } from './pages/AssistantPage'
import { CustomersPage } from './pages/CustomersPage'
import { DashboardPage } from './pages/DashboardPage'
import { LeadsPage } from './pages/LeadsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PianosPage } from './pages/PianosPage'
import { SalesPage } from './pages/SalesPage'
import { SearchPage } from './pages/SearchPage'
import { ServicesPage } from './pages/ServicesPage'
import { WarrantiesPage } from './pages/WarrantiesPage'
import { WarrantiesPrintPage } from './pages/WarrantiesPrintPage'

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
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
      </BrowserRouter>
    </RoleProvider>
  )
}
