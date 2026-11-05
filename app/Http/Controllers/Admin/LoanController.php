<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CountrySetting;
use App\Models\Loan;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\PaymentReminder;
use App\Support\LoanMath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class LoanController extends Controller
{
    public const FILTERS = ['search', 'country', 'status', 'from', 'to'];

    public function index(Request $request)
    {
        $filters = $request->only(self::FILTERS);

        return Inertia::render('Admin/Loans/Index', [
            'filters' => $filters,
            'loans' => Loan::with('user:id,name,email')->filter($filters)->latest()->paginate(15)->withQueryString(),
        ]);
    }

    public function show(Loan $loan)
    {
        return Inertia::render('Admin/Loans/Show', [
            'loan' => $loan->load('user:id,name,email,phone', 'application:id,reference,disbursement_method', 'installments', 'payments.recorder:id,name'),
            'methods' => Payment::METHODS,
        ]);
    }

    /** Staff can send the email reminder by hand, for the most urgent unpaid installment. */
    public function remind(Loan $loan)
    {
        $next = $loan->nextInstallment();
        if (! $next) {
            return back()->with('error', 'This loan has nothing left to pay.');
        }
        $next->setRelation('loan', $loan);
        $days = (int) round(today()->diffInDays($next->due_date, false));
        $loan->user->notify(new PaymentReminder($next, $days < 0 ? 'overdue' : ($days === 0 ? 'due_today' : 'upcoming')));
        $next->forceFill(['reminded_on' => today()])->save();

        return back()->with('success', 'Reminder sent by email and SMS to '.$loan->user->name.'.');
    }

    /**
     * Add a loan the client already had before using the site (no application). The schedule is built as usual from
     * the start date; anything already paid is recorded as one payment, filling the oldest installments first.
     */
    public function store(Request $request, User $user)
    {
        abort_unless($user->role === 'borrower', 404);
        $country = CountrySetting::where('code', $user->country)->first();
        abort_unless($country, 422, __('Set the client country first.'));

        $data = $request->validate([
            'reference' => ['nullable', 'string', 'max:30', 'unique:loans,reference'],
            'principal' => ['required', 'numeric', 'gt:0', 'max:9999999999999'],
            'interest_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'term_months' => ['required', 'integer', 'min:1', 'max:24'],
            'repayment_frequency' => ['required', Rule::in(array_keys(LoanMath::PER_MONTH))],
            'disbursed_at' => ['required', 'date', 'before_or_equal:today'],
            'already_paid' => ['nullable', 'numeric', 'min:0', 'max:'.LoanMath::totalPayable((float) $request->input('principal'), (float) $request->input('interest_rate'))],
            'paid_on' => ['required_with:already_paid', 'nullable', 'date', 'after_or_equal:disbursed_at', 'before_or_equal:today'],
        ]);

        $loan = DB::transaction(function () use ($data, $user, $country, $request) {
            $loan = Loan::open([
                'reference' => ($data['reference'] ?? '') ?: 'TMP-'.Str::random(10),
                'user_id' => $user->id,
                'country' => $country->code,
                'currency' => $country->currency,
                'principal' => $data['principal'],
                'interest_rate' => $data['interest_rate'],
                'term_months' => $data['term_months'],
                'repayment_frequency' => $data['repayment_frequency'],
                'disbursed_at' => $data['disbursed_at'],
            ]);
            // Own series (LN-E…) so it never clashes with LN-<application id>.
            if (str_starts_with($loan->reference, 'TMP-')) {
                $loan->update(['reference' => 'LN-E'.str_pad($loan->id, 5, '0', STR_PAD_LEFT)]);
            }
            if ((float) ($data['already_paid'] ?? 0) > 0) {
                $loan->recordPayment((float) $data['already_paid'], [
                    'paid_on' => $data['paid_on'],
                    'method' => 'other',
                    'reference' => 'Paid before being added',
                    'recorded_by' => $request->user()->id,
                ]);
            }

            return $loan;
        });

        return redirect("/admin/loans/{$loan->id}")->with('success', __('Loan added.'));
    }

    public function storePayment(Request $request, Loan $loan)
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:'.$loan->outstanding()],
            'paid_on' => ['required', 'date', 'before_or_equal:today'],
            'method' => ['required', Rule::in(Payment::METHODS)],
            'reference' => ['nullable', 'string', 'max:120'],
        ]);

        $loan->recordPayment((float) $data['amount'], [
            'paid_on' => $data['paid_on'],
            'method' => $data['method'],
            'reference' => $data['reference'] ?? null,
            'recorded_by' => $request->user()->id,
        ]);

        return back()->with('success', __('Payment recorded.'));
    }
}
