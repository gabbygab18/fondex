<?php

namespace App\Support;

use App\Models\Loan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\URL;
use RuntimeException;

/**
 * Where "Pay now" sends the borrower. PAYMENT_GATEWAY=sandbox uses a built-in test checkout
 * (no real money) until the client has a gateway account; =stripe uses Stripe Checkout.
 */
class PaymentGateway
{
    public static function checkoutUrl(Loan $loan, float $amount): string
    {
        return match (config('loan.gateway')) {
            'stripe' => self::stripe($loan, $amount),
            default => URL::temporarySignedRoute('pay.sandbox', now()->addMinutes(30), ['loan' => $loan->id, 'amount' => number_format($amount, 2, '.', '')]),
        };
    }

    private static function stripe(Loan $loan, float $amount): string
    {
        $secret = config('loan.stripe.secret') ?: throw new RuntimeException('STRIPE_SECRET is not set.');

        $session = Http::withToken($secret)->asForm()->post('https://api.stripe.com/v1/checkout/sessions', [
            'mode' => 'payment',
            'client_reference_id' => $loan->id,
            'customer_email' => $loan->user->email,
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => strtolower($loan->currency),
                    'unit_amount' => (int) round($amount * 100),
                    'product_data' => ['name' => "Fondex {$loan->reference}"],
                ],
            ]],
            'metadata' => ['loan_id' => $loan->id],
            'success_url' => url("/account/loans/{$loan->id}?payment=success"),
            'cancel_url' => url("/account/loans/{$loan->id}?payment=cancelled"),
        ])->throw()->json();

        return $session['url'];
    }

    /** Verifies a Stripe webhook (Stripe-Signature header) and returns the decoded event, or null if it doesn't check out. */
    public static function stripeEvent(string $payload, ?string $header): ?array
    {
        $secret = config('loan.stripe.webhook_secret');
        if (! $secret || ! $header) {
            return null;
        }
        parse_str(str_replace(',', '&', $header), $parts);
        $t = (int) ($parts['t'] ?? 0);
        $expected = hash_hmac('sha256', "{$t}.{$payload}", $secret);
        // Reject stale timestamps so a captured request can't be replayed later.
        if (abs(time() - $t) > 300 || ! hash_equals($expected, (string) ($parts['v1'] ?? ''))) {
            return null;
        }

        return json_decode($payload, true);
    }
}
