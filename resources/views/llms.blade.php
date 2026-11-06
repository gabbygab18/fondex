# {{ config('app.name') }}

> {{ config('app.name') }} offers short-term personal loans in Argentina and Colombia. Apply online in minutes, get a decision within 24 hours on business days, and repay in equal daily, weekly or fortnightly payments. The site is in Spanish and English.

- Website: {{ url('/') }}
- Countries: Argentina (ARS) and Colombia (COP)
@if (config('loan.admin_email'))
- Email: {{ config('loan.admin_email') }}
@endif
@if (config('loan.phone'))
- Phone: {{ config('loan.phone') }}
@endif
- Live chat: on every page of the website

## Loans

@foreach ($countries as $c)
- {{ $c->name }}: from {{ number_format($c->min_amount, 0, ',', '.') }} to {{ number_format($c->max_amount, 0, ',', '.') }} {{ $c->currency }}, repaid over {{ $c->min_term }} to {{ $c->max_term }} months.
@endforeach
- Loan types: personal, emergency, debt consolidation, education, medical, home improvement and vehicle.
- Interest: a single charge on the amount borrowed, set according to the applicant's profile. The exact rate and the total to repay are confirmed when the loan is approved, before any money is sent.
- No penalties for paying early.

## How it works

1. Apply online in a few minutes and upload your ID and proof of income.
2. Get a decision within 24 hours on business days, by email.
3. Once approved, the money is sent to your bank account or for cash pick-up.
4. Repay in equal daily, weekly or fortnightly payments and follow your schedule in your account.

## Frequently asked questions

@foreach ($faqs as [$q, $a])
### {!! $q !!}

{!! $a !!}

@endforeach
## Pages

- [Loans]({{ url('/loans') }}): loan types, amounts and terms per country, and a loan calculator
- [FAQs]({{ url('/faqs') }}): requirements, documents, repayment and timing
- [About]({{ url('/about') }})
- [Contact]({{ url('/contact') }})
- [Apply]({{ url('/apply') }})
- [Privacy Policy]({{ url('/privacy') }})
- [Terms and Conditions]({{ url('/terms') }})
