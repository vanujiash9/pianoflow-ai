# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: warranties-print.spec.ts >> warranty print route renders the A4 shell
- Location: tests/warranties-print.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('BH-001-001')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('BH-001-001')
  - Target page, context or browser has been closed

```

```yaml
- complementary:
  - text: PS
  - strong: Piano Solna
  - text: Quản lý cửa hàng
  - button "Thu gọn sidebar"
  - navigation:
    - link "Tổng quan":
      - /url: /
    - link "Khách hàng":
      - /url: /customers
    - link "Bán hàng":
      - /url: /sales
    - link "Bảo hành":
      - /url: /warranties
    - link "Khách tiềm năng":
      - /url: /leads
    - link "Trợ lý AI":
      - /url: /assistant
    - link "Người dùng":
      - /url: /settings/users
  - button "C Chủ shop Chủ shop":
    - text: C
    - strong: Chủ shop
    - text: Chủ shop
- main:
  - textbox "Tìm khách, đàn, serial, số điện thoại..."
  - button "Thông báo"
  - button "admin"
  - text: C
  - heading "Tạo phiếu bảo hành" [level=1]
  - paragraph: Nhập khách hàng, serial và thời gian bảo hành để lưu rồi in phiếu.
  - button "Lưu và in phiếu"
  - text: Họ tên khách hàng
  - textbox "Họ tên khách hàng":
    - /placeholder: Nhập họ tên
  - text: Số điện thoại
  - textbox "Số điện thoại":
    - /placeholder: Nhập số điện thoại
  - text: Địa chỉ
  - textbox "Địa chỉ":
    - /placeholder: Nhập địa chỉ
  - text: Đàn
  - textbox "Đàn":
    - /placeholder: Nhập tên đàn / model
  - text: Serial
  - textbox "Serial":
    - /placeholder: Nhập serial
  - text: Bắt đầu
  - textbox "Bắt đầu"
  - text: Kết thúc
  - textbox "Kết thúc"
  - text: Ngày in
  - textbox "Ngày in": 23/8/2026
  - text: Ghi chú
  - textbox "Ghi chú":
    - /placeholder: Điền lưu ý nếu có
  - img "Logo Piano Solna"
  - text: "PIANO SOLNA Trụ sở chính / Kho TP.HCM: 140/27/11 Đường Vườn Lài, Phường An Phú Đông, Quận 12, TP.HCM 090 687 6281 0896 405 421 0705 210 821"
  - heading "PHIẾU BẢO HÀNH" [level=1]
  - text: "● ● ● Mã phiếu:"
  - strong: —
  - text: "1"
  - strong: THÔNG TIN KHÁCH HÀNG
  - table:
    - rowgroup:
      - row "Họ tên khách hàng":
        - columnheader "Họ tên khách hàng"
        - cell
      - row "Số điện thoại":
        - columnheader "Số điện thoại"
        - cell
      - row "Địa chỉ —":
        - rowheader "Địa chỉ"
        - cell "—"
  - text: "2"
  - strong: THÔNG TIN SẢN PHẨM
  - table:
    - rowgroup:
      - row "Sản phẩm":
        - columnheader "Sản phẩm"
        - cell
      - row "Serial —":
        - rowheader "Serial"
        - cell "—"
      - row "Bắt đầu":
        - columnheader "Bắt đầu"
        - cell
      - row "Kết thúc":
        - columnheader "Kết thúc"
        - cell
  - text: "3"
  - strong: GHI CHÚ
  - text: TP. Hồ Chí Minh, ngày 23/8/2026 CHÍNH SÁCH BẢO HÀNH
  - paragraph: Tất cả sản phẩm piano do Piano Solna cung cấp đều được bảo hành theo đúng cam kết.
  - paragraph: 1. Thời hạn bảo hành
  - paragraph: • Thời gian bảo hành được ghi trên phiếu bảo hành hoặc hợp đồng mua bán.
  - paragraph: 2. Phạm vi bảo hành
  - paragraph: • Lỗi kỹ thuật phát sinh do nhà sản xuất.
  - paragraph: • Hư hỏng do linh kiện bị lỗi trong điều kiện sử dụng bình thường.
  - paragraph: 3. Trường hợp không được bảo hành miễn phí
  - paragraph: • Hư hỏng do va đập, rơi vỡ, ngập nước, cháy nổ hoặc tác động ngoại lực.
  - paragraph: • Tự ý sửa chữa, thay đổi linh kiện ngoài hệ thống Piano Solna.
  - paragraph: • Bảo quản trong môi trường ẩm mốc, nhiệt độ hoặc độ ẩm không phù hợp.
  - strong: ĐẠI DIỆN CỬA HÀNG
  - text: (Ký và ghi rõ họ tên) PIANO SOLNA PIANO SOLNA Piano Solna
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | 
  3  | test('warranty print route renders the A4 shell', async ({ page }) => {
  4  |   await page.route('**/api/v1/auth/me', async (route) => {
  5  |     await route.fulfill({
  6  |       contentType: 'application/json',
  7  |       body: JSON.stringify({
  8  |         user: {
  9  |           id: 'u1',
  10 |           username: 'tester',
  11 |           role: 'admin',
  12 |           is_active: true,
  13 |           last_login_at: null,
  14 |         },
  15 |       }),
  16 |     })
  17 |   })
  18 | 
  19 |   await page.route('**/api/v1/warranties', async (route) => {
  20 |     await route.fulfill({
  21 |       contentType: 'application/json',
  22 |       body: JSON.stringify([
  23 |         {
  24 |           id: 'f3b8e4c2-1111-4444-8888-123456789abc',
  25 |           sale_id: 'b7d8a2a0-2222-4444-8888-123456789abc',
  26 |           customer_id: 'c1d2e3f4-3333-4444-8888-123456789abc',
  27 |           customer_name: 'Nguyễn Văn A',
  28 |           customer_phone: '0901234567',
  29 |           customer_address: 'Quận 12, TP.HCM',
  30 |           piano_id: 'p1',
  31 |           piano_name: 'Yamaha U1',
  32 |           serial_number: 'SN-001',
  33 |           start_date: '2026-08-12',
  34 |           end_date: '2027-08-12',
  35 |           status: 'active',
  36 |           days_remaining: 365,
  37 |           notes: null,
  38 |         },
  39 |       ]),
  40 |     })
  41 |   })
  42 | 
  43 |   await page.goto('/warranties/print')
  44 | 
  45 |   await expect(page.getByRole('heading', { name: 'PHIẾU BẢO HÀNH', exact: true })).toBeVisible()
> 46 |   await expect(page.getByText('BH-001-001')).toBeVisible()
     |                                              ^ Error: expect(locator).toBeVisible() failed
  47 |   await expect(page.getByText('Nguyễn Văn A')).toBeVisible()
  48 |   await expect(page.getByText('Yamaha U1')).toBeVisible()
  49 |   await expect(page.getByText('SN-001')).toBeVisible()
  50 | })
  51 | 
```