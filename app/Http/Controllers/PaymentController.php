<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\Payment;
use App\Support\PaymentGateway;
use Illuminate\Http\Request;
use Inertia\Inertia;

/** Borrower online payments: start a checkout, the sandbox checkout itself, and the Stripe webhook. */
class PaymentController extends Controller
{
    public function start(Request $request, Loan $loan)
    {
        abort_unless($loan->user_id === $request->user()->id && $loan->status === 'active', 404);
        $request->validate(['pay' => ['required', 'in:next,full']]);

        $next = $loan->nextInstallment();
        $amount = $request->input('pay') === 'full' || ! $next
            ? $loan->outstanding()
            : round($next->amount_due - $next->amount_paid, 2);

        return Inertia::location(PaymentGateway::checkoutUrl($loan, $amount));
    }

    public function sandbox(Request $request, Loan $loan)
    {
        abort_unless($loan->user_id === $request->user()->id, 404);

        return Inertia::render('Pay/Sandbox', [
            'loan' => $loan->only('id', 'reference', 'currency'),
            'amount' => (float) $request->query('amount'),
            'confirmUrl' => $request->fullUrl(),
        ]);
    }

    public function sandboxConfirm(Request $request, Loan $loan)
    {
        abort_unless($loan->user_id === $request->user()->id, 404);
        // The signed URL is single-use: its signature becomes the payment's unique gateway reference.
        $ref = 'sandbox_'.substr($request->query('signature'), 0, 40);
        if (! Payment::where('gateway_ref', $ref)->exists()) {
            $loan->recordPayment(min((float) $request->query('amount'), $loan->outstanding()), [
                'paid_on' => today(), 'method' => 'online', 'reference' => 'Sandbox test payment', 'gateway_ref' => $ref,
            ]);
        }

        return redirect("/account/loans/{$loan->id}")->with('success', __('Payment received. Thank you!'));
    }

    public function stripeWebhook(Request $request)
    {
        $event = PaymentGateway::stripeEvent($request->getContent(), $request->header('Stripe-Signature'));
        if (! $event) {
            return response('Invalid signature', 400);
        }

        $session = $event['data']['object'] ?? [];
        if ($event['type'] === 'checkout.session.completed' && ($session['payment_status'] ?? null) === 'paid') {
            $loan = Loan::find($session['metadata']['loan_id'] ?? 0);
            if ($loan && ! Payment::where('gateway_ref', $session['id'])->exists()) {
                $loan->recordPayment(min($session['amount_total'] / 100, $loan->outstanding()), [
                    'paid_on' => today(), 'method' => 'online', 'reference' => $session['payment_intent'] ?? $session['id'], 'gateway_ref' => $session['id'],
                ]);
            }
        }

        return response('ok');
    }
}
