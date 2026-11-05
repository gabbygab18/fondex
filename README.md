# Fondex — loan platform

Laravel 12 · Inertia v3 · React 19 · Tailwind 4 · MySQL. UI built with Glint UI components, the local icon set (filled), Satoshi + Poppins.

## Setup

```bash
composer install
npm install
cp .env.example .env && php artisan key:generate   # then set DB_* and LOAN_* (below)
php artisan migrate --seed
npm run build            # or `npm run dev` while developing
php artisan serve
```

Seeded logins (password `password`): `admin@fondex.test` (admin), `staff@fondex.test` (staff), `borrower1@fondex.test` … `borrower7@fondex.test` (demo borrowers, local env only).

## Configuration (.env)

| Key | Purpose |
|---|---|
| `APP_NAME` | Brand name shown everywhere |
| `APP_TIMEZONE` | Business timezone for due dates (default Buenos Aires) |
| `LOAN_ADMIN_EMAIL` | Receives contact inquiries and new-application alerts |
| `LOAN_WHATSAPP` | WhatsApp number, digits with country code (floating button) |
| `LOAN_PHONE` | Phone shown on the site |
| `MAIL_*` | SMTP for real emails (`MAIL_MAILER=log` writes them to `storage/logs`) |
| `PAYMENT_GATEWAY` | `sandbox` (built-in test checkout, no real money) or `stripe` |
| `SMS_DRIVER` | `log` (texts written to `storage/logs`, nothing sent) or `twilio` |
| `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM` | Twilio account and sender number for reminder texts |
| `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET` | Stripe keys; point a Stripe webhook (`checkout.session.completed`) at `/webhooks/stripe` |

## Lending rules

- Personal loans only, 1–3 month terms, repaid **daily, weekly or fortnightly** (30 / 4 / 2 installments per month).
- Interest is a **flat rate on the principal** that staff choose when approving, from the client's profile (the approval screen shows an affordability summary per rate): 20%, 25%, 30% or 35% (`config/loan.php` → `rates`). Borrow 1,000 at 20% → repay 1,200 in equal installments.
- Amount limits and allowed terms per country (ARS / COP) are edited in **Admin → Settings**.
- ID numbers and bank account numbers are encrypted in the database (`APP_KEY`); only staff see them in full.

## Payment reminders

`php artisan loans:remind` sends borrowers an **email and a text message** (one reminder per loan per day at most): weekly/fortnightly plans the day before and on the due date; all plans 1, 3 and 7 days late. It's scheduled daily at 09:00, so the server needs the Laravel scheduler running (`* * * * * php artisan schedule:run` in cron, or `php artisan schedule:work`). Staff can also send an email reminder or open a pre-filled WhatsApp message from the loan and client pages.

## Where things live

- `app/Support/LoanMath.php` — flat-rate schedules (mirrored in `resources/js/lib/format.ts` for the calculator)
- `app/Models/Loan.php` — loan creation from an approved application, payment allocation (oldest installment first)
- `app/Support/PaymentGateway.php` — sandbox / Stripe checkout and webhook verification
- `routes/web.php` — public site, borrower area (`/account`), admin portal (`/admin`); `routes/console.php` — reminder command
- `lang/es.json` — Spanish text for both Laravel and React (`t('English text')`)
- `resources/js/components/glint` — Glint UI components, `resources/js/icons` — icon set
- Uploaded documents are stored on the private `local` disk and served only to the owner or staff.

## Tests

```bash
php artisan test
```

## Before launch

- Set `SMS_DRIVER=twilio` with the client's Twilio details so reminder texts are actually sent.
- Switch `PAYMENT_GATEWAY` to `stripe` (or add Mercado Pago / PSE / Wompi) once the client has an account; until then online payments are test-only.
- Legal pages should be reviewed by a lawyer.
# fondex
