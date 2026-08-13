import { expect, test } from '@playwright/test'

test('warranty submit waits for saved response before printing', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as unknown as { __printCount: number; print: () => void }).__printCount = 0
    window.print = () => {
      ;(window as unknown as { __printCount: number }).__printCount += 1
    }
  })

  await page.route('**/api/v1/sales', async (route) => {
    const body = route.request().postDataJSON() as { serial_number: string }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'f3b8e4c2-1111-4444-8888-123456789abc',
        customer_id: 'c1d2e3f4-3333-4444-8888-123456789abc',
        customer_name: 'Nguyễn Văn A',
        customer_phone: '0901234567',
        customer_address: 'Quận 12, TP.HCM',
        piano_id: 'p1',
        piano_name: 'Yamaha U1',
        serial_number: body.serial_number,
        sale_date: '2026-08-13',
        warranty_id: 'w1',
        warranty_start_date: '2026-08-13',
        warranty_end_date: '2027-08-13',
        notes: null,
      }),
    })
  })

  await page.goto('/warranties')
  await page.getByPlaceholder('Nguyễn Văn A').fill('Nguyễn Văn A')
  await page.getByPlaceholder('0901234567').fill('0901234567')
  await page.getByPlaceholder('Quận 12, TP.HCM').fill('Quận 12, TP.HCM')
  await page.getByPlaceholder('AB123456').fill('AB123456')
  await page.getByRole('button', { name: 'In phiếu' }).click()

  await expect(page.getByText('BH-F3B8E4C2')).toBeVisible()
  await expect(page.getByText('Nguyễn Văn A')).toBeVisible()
  await expect(page.getByText('13/8/2027')).toBeVisible()
  await expect(page.evaluate(() => (window as unknown as { __printCount: number }).__printCount)).resolves.toBe(1)
})
