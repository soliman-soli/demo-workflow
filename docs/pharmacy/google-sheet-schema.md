# Dawaa Pharmacy — Google Sheet Schema

Create one Google Spreadsheet named **Dawaa** with three tabs matching the exact column headers below.

---

## Tab 1: `Catalog`

Holds the pharmacy inventory, prescription rules, and out-of-stock alternatives.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique product code (e.g. `P101`, `A201`). |
| `name` | string | Yes | Display medicine name (e.g. `Panadol`, `Augmentin`). |
| `strength` | string | Yes | Dosage strength (e.g. `500mg`, `1g`, `500mg/65mg`). |
| `price_egp` | number | Yes | Unit pack price in EGP. |
| `stock` | integer | Yes | Current shelf quantity (`>= 0`). Updated on auto-reserve, pharmacist approval, or expiration restore. |
| `requires_rx` | boolean | Yes | `true` if a pharmacist must approve via Telegram; `false` for OTC auto-reserve. |
| `alternative_id` | string \| empty | No | Reference to another `Catalog.id` (e.g. `Augmentin 1g` (`A201`) → `Hibiotic 1g` (`A202`) at 96 EGP). |

Seed values live in [catalog-seed.csv](./catalog-seed.csv).

---

## Tab 2: `Reservations`

Each medicine in a customer request is stored as its own normalized row.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `request_id` | string | Yes | Identifier formatted as `R-YYMMDD-XXXX` (e.g. `R-261120-K9M2`). |
| `line_no` | integer | Yes | 1-based line number within `request_id`. |
| `customer` | string | Yes | Customer name or WhatsApp profile name. |
| `medicine_id` | string | Yes | Matched `Catalog.id`. |
| `qty` | integer | Yes | Requested quantity (`>= 1`). |
| `status` | enum | Yes | One of: `pending`, `reserved`, `rejected`, `expired`. |
| `created_at` | string (ISO 8601) | Yes | Timestamp when row was created. |
| `expires_at` | string (ISO 8601) | No | Reservation hold deadline (`created_at + 2 hours`); empty if `rejected` or `expired`. |

---

## Tab 3: `Errors`

Audit log for unmatched medicine queries, blocked out-of-stock approvals, and unexpected workflow errors.

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `timestamp` | string (ISO 8601) | Yes | Time the error or block occurred. |
| `workflow` | string | Yes | Workflow name (`customer-message`, `pharmacist-decision`, `expire-reservations`). |
| `message` | string | Yes | Human-readable error or block reason. |
