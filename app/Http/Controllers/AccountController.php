<?php

namespace App\Http\Controllers;

use App\Models\CountrySetting;
use App\Models\Loan;
use App\Support\CreditProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = $request->user();

        return Inertia::render('Account/Dashboard', [
            'applications' => $user->applications()->latest()->get(),
            'loans' => $user->loans()->latest()->with(['installments' => fn ($q) => $q->whereColumn('amount_paid', '<', 'amount_due')->limit(1)])->get(),
            'credit' => $this->credit($request),
        ]);
    }

    public function loan(Request $request, Loan $loan)
    {
        abort_unless($loan->user_id === $request->user()->id, 404);

        return Inertia::render('Account/Loan', [
            'loan' => $loan->load('installments', 'payments'),
            'credit' => $this->credit($request),
        ]);
    }

    /** Score and limits, for the "good payer" offer. */
    private function credit(Request $request): array
    {
        $user = $request->user();

        return CreditProfile::for($user)->summary(CountrySetting::firstWhere('code', $user->country));
    }
}
