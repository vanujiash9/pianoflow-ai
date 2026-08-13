import { api } from '../../../lib/api'

export interface WarrantySaleCustomerInput {
  name: string
  phone: string
  address: string
}

export interface WarrantySaleRequest {
  customer: WarrantySaleCustomerInput
  serial_number: string
  sale_date: string
  warranty_months: number
  notes: string | null
}

export interface WarrantySaleResponse {
  id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_address: string | null
  piano_id: string
  piano_name: string
  serial_number: string | null
  sale_date: string
  warranty_id: string | null
  warranty_start_date: string | null
  warranty_end_date: string | null
  notes: string | null
}

export function createWarrantySale(payload: WarrantySaleRequest) {
  return api<WarrantySaleResponse>('/sales', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}