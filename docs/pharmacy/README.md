# Dawaa Pharmacy — n8n Automation Setup

This directory contains the importable n8n workflows, Google Sheet schema, and seed data for **Dawaa Pharmacy** (`/projects/pharmacy-system`).

---

## 1. Architecture Overview

```text
Browser ──► Next.js /api/pharmacy/* ──► n8n Webhooks (X-API-KEY) ──► Gemini 2.5 Flash
                                                                   ├── Google Sheets (Dawaa)
                                                                   ├── WhatsApp Business Cloud
                                                                   └── Telegram Group (Dawaa Pharmacists)
```

- **Security**: The browser never receives `N8N_PHARMACY_BASE_URL` or `N8N_SECRET`. Uploaded prescription images are validated (JPEG/PNG/WebP, max 5 MB + magic bytes) and forwarded in memory without being written to disk.
- **Safety invariant**: Gemini only extracts `{ "is_prescription": boolean, "medicines": string[] }`. **Only a pharmacist** clicking `Approve` in Telegram can authorize a prescription order or deduct Rx stock.

---

## 2. Environment Variables

### Next.js (`.env.local` / Vercel)

| Variable | Description |
| --- | --- |
| `USE_MOCKS` | Set to `"false"` to use live n8n webhooks. If omitted alongside pharmacy env vars, the app automatically falls back to its built-in workflow simulator (`mode: "mock"`). |
| `N8N_PHARMACY_BASE_URL` | Base webhook URL for pharmacy n8n workflows, without trailing slash (e.g. `https://your-n8n.app.n8n.cloud/webhook`). |
| `N8N_SECRET` | Shared secret sent in the `X-API-KEY` header to n8n Webhook triggers. |

### n8n Instance Environment Variables

Configure these in your n8n environment (Settings -> Variables or `.env`):

| Variable | Description |
| --- | --- |
| `DAWAA_SHEET_ID` | Google Spreadsheet ID containing `Catalog`, `Reservations`, and `Errors` tabs. |
| `TELEGRAM_PHARMACISTS_CHAT_ID` | Chat/supergroup ID of the `Dawaa Pharmacists` Telegram group. |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta WhatsApp Business Cloud API phone number ID. |
| `N8N_DEMO_SKIP_EXTERNAL_SEND` | Optional (`"true"` / `"false"`). When `"true"`, skips real Meta WhatsApp send during sandbox tests while returning the full response JSON to Next.js. |

---

## 3. Setup Steps

### A. Create the Google Sheet
1. Create a Google Spreadsheet named **Dawaa**.
2. Create three tabs matching [google-sheet-schema.md](./google-sheet-schema.md):
   - `Catalog`
   - `Reservations`
   - `Errors`
3. Import [catalog-seed.csv](./catalog-seed.csv) into the `Catalog` tab (`File -> Import`). Confirm row `A201` (`Augmentin 1g`) has `stock = 0`, `requires_rx = true`, `alternative_id = A202`.

### B. Configure Telegram Group & Bot
1. Create a bot with `@BotFather` (`Dawaa Bot`) and copy its token into an n8n **Telegram API** credential named `Dawaa Telegram Bot`.
2. Add the bot to your `Dawaa Pharmacists` Telegram group as an admin so it can send and edit inline keyboard messages.
3. Put that group chat ID into `TELEGRAM_PHARMACISTS_CHAT_ID`.

### C. Configure Gemini, Google Sheets & Header Auth Credentials in n8n
Create the following credentials inside n8n:
- **Header Auth** (`Dawaa Webhook Header Auth`): Name = `X-API-KEY`, Value = your `N8N_SECRET`.
- **Google Gemini (PaLM) API**: Gemini 2.5 Flash API key.
- **Google Sheets OAuth2 API**: Access to the `Dawaa` spreadsheet.
- **WhatsApp Cloud API** (for real WhatsApp replies and triggers).

### D. Import & Activate Workflows
1. Import [customer-message.workflow.json](./customer-message.workflow.json) and activate it.
   - Serves both live **WhatsApp Trigger** and demo webhook `POST /pharmacy/message`.
2. Import [pharmacist-decision.workflow.json](./pharmacist-decision.workflow.json) and activate it.
   - Serves both live **Telegram Trigger** (`callback_query`) and demo webhook `POST /pharmacy/decision`.
3. Import [expire-reservations.workflow.json](./expire-reservations.workflow.json) and activate it.
   - Scheduled every 15 minutes to expire holds older than 2 hours and return `reserved` stock to `Catalog`.

### E. Verify
Set `N8N_PHARMACY_BASE_URL`, `N8N_SECRET`, and `USE_MOCKS=false` in `.env.local`, restart `npm run dev`, and visit `/projects/pharmacy-system`.
