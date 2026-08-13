export type PianoStatus = 'available' | 'reserved' | 'sold' | 'service'
export type PianoCondition = 'new' | 'used'
export type LeadStatus = 'new' | 'contacted' | 'visited' | 'considering' | 'won' | 'lost'

export interface CustomerSummary {
  id: string
  name: string
  phone: string
  address: string | null
}

export interface LeadCustomer extends CustomerSummary {}
export type ServiceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface Customer {
  id: string
  name: string
  phone: string
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Piano {
  id: string
  brand: string
  model: string
  serial_number: string
  year: number | null
  color: string | null
  condition: PianoCondition
  status: PianoStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  piano_id: string
  piano_name: string
  serial_number: string
  sale_date: string
  warranty_end_date: string | null
  notes: string | null
}

export interface Warranty {
  id: string
  sale_id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_address: string | null
  piano_id: string
  piano_name: string
  serial_number: string
  start_date: string
  end_date: string
  status: 'active' | 'expiring' | 'expired' | 'voided'
  days_remaining: number
  notes: string | null
}

export interface ServiceRecord {
  id: string
  customer_name: string
  customer_phone: string
  piano_name: string
  serial_number: string
  service_date: string
  service_type: string
  description: string | null
  next_service_date: string | null
  status: ServiceStatus
  notes: string | null
}

export interface Lead {
  id: string
  customer_id: string
  customer: CustomerSummary
  budget_min: number | null
  budget_max: number | null
  interested_brand: string | null
  interested_model: string | null
  status: LeadStatus
  follow_up_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DashboardData {
  kpis: {
    available_pianos: number
    sold_this_month: number
    total_customers: number
    action_items: number
  }
  sales_by_month: { month: string; count: number }[]
  attention_items: {
    type: string
    title: string
    subtitle: string
    due_date: string | null
    priority: string
  }[]
  recent_customers: {
    name: string
    phone: string
    last_piano: string | null
    last_purchase_date: string | null
    warranty_status: string | null
  }[]
}

export interface CustomerProfile {
  customer: Customer
  purchases: {
    piano_id: string
    piano_name: string
    serial_number: string
    sale_date: string
    warranty_end_date: string | null
    warranty_status: string | null
  }[]
  services: {
    piano_name: string
    service_date: string
    service_type: string
    next_service_date: string | null
    status: string
  }[]
}
