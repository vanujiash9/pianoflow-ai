import { expect, test } from '@playwright/test'

test('warranty print route renders the A4 shell', async ({ page }) => {
  await page.route('**/api/v1/warranties', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'f3b8e4c2-1111-4444-8888-123456789abc',
          sale_id: 'b7d8a2a0-2222-4444-8888-123456789abc',
          customer_id: 'c1d2e3f4-3333-4444-8888-123456789abc',
          customer_name: 'Nguyễn Văn A',
          customer_phone: '0901234567',
          customer_address: 'Quận 12, TP.HCM',
          piano_id: 'p1',
          piano_name: 'Yamaha U1',
          serial_number: 'SN-001',
          start_date: '2026-08-12',
          end_date: '2027-08-12',
          status: 'active',
          days_remaining: 365,
          notes: null,
        },
      ]),
    })
  })

  await page.goto('/warranties/print')

  await expect(page.getByRole('heading', { name: 'PHIẾU BẢO HÀNH' })).toBeVisible()
  await expect(page.getByText('BH-F3B8E4C2')).toBeVisible()
  await expect(page.getByText('Nguyễn Văn A')).toBeVisible()
  await expect(page.getByText('Yamaha U1')).toBeVisible()
  await expect(page.getByText('SN-001')).toBeVisible()
})
