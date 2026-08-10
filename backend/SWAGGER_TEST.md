# Swagger test checklist

Run:

```bash
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs`.

## Minimal happy path

### 1. Create customer
`POST /api/v1/customers`

```json
{
  "name": "Nguyễn Văn Minh",
  "phone": "0901234567",
  "address": "TP.HCM",
  "notes": "Khách cũ"
}
```

### 2. Create piano
`POST /api/v1/pianos`

```json
{
  "brand": "Kawai",
  "model": "KL-901",
  "serial_number": "KW-DEMO-001",
  "year": 1988,
  "color": "Đen",
  "condition": "used",
  "status": "available",
  "notes": null
}
```

### 3. Create sale
Copy the returned customer and piano UUIDs into `POST /api/v1/sales`.

```json
{
  "customer_id": "<CUSTOMER_UUID>",
  "piano_id": "<PIANO_UUID>",
  "sale_date": "2026-08-10",
  "warranty_months": 12,
  "notes": "Bàn giao tại shop"
}
```

Expected:
- piano status becomes `sold`
- a warranty is created automatically

### 4. Check warranty
`GET /api/v1/warranties`

### 5. Add service record
`POST /api/v1/services`

Use the same customer/piano IDs.

### 6. Dashboard
`GET /api/v1/dashboard`

### 7. AI assistant
Enable the LLM config in `.env`, restart backend, then call `POST /api/v1/ai/chat`:

```json
{
  "message": "Anh Minh từng mua đàn gì và còn bảo hành không?",
  "conversation_id": null
}
```

Reuse the returned `conversation_id` for the next message to test memory:

```json
{
  "message": "Cây đó khi nào hết bảo hành?",
  "conversation_id": "<RETURNED_UUID>"
}
```
