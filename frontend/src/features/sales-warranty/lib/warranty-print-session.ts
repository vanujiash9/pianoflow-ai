const WARRANTY_PRINT_SESSION_KEY = 'warranty-print-payload'

export interface WarrantyPrintPayload {
  customerName: string
  customerPhone: string
  customerAddress: string
  pianoName: string
  serialNumber: string | null
  startDate: string
  endDate: string
  notes: string
  receiptId: string
  warrantyCode: string
  createdAt: string
}

export function createWarrantyPrintPayload(
  receiptId: string,
  warrantyCode: string,
  form: {
    customerName: string
    customerPhone: string
    customerAddress: string
    pianoName: string
    serialNumber: string
    startDate: string
    endDate: string
    notes: string
  },
): WarrantyPrintPayload {
  return {
    customerName: form.customerName.trim(),
    customerPhone: form.customerPhone.trim(),
    customerAddress: form.customerAddress.trim(),
    pianoName: form.pianoName.trim(),
    serialNumber: form.serialNumber.trim() || null,
    startDate: form.startDate,
    endDate: form.endDate,
    notes: form.notes.trim(),
    receiptId,
    warrantyCode,
    createdAt: new Date().toISOString(),
  }
}

export function saveWarrantyPrintPayload(payload: WarrantyPrintPayload): void {
  sessionStorage.setItem(WARRANTY_PRINT_SESSION_KEY, JSON.stringify(payload))
}

export function readWarrantyPrintPayload(): WarrantyPrintPayload | null {
  const value = sessionStorage.getItem(WARRANTY_PRINT_SESSION_KEY)
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as WarrantyPrintPayload
    if (!parsed.receiptId || !parsed.customerName || !parsed.customerPhone) return null
    return parsed
  } catch {
    return null
  }
}

export function clearWarrantyPrintPayload(): void {
  sessionStorage.removeItem(WARRANTY_PRINT_SESSION_KEY)
}

export function hasWarrantyPrintPayload(): boolean {
  return Boolean(readWarrantyPrintPayload())
}
