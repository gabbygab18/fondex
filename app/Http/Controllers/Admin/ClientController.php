<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CountrySetting;
use App\Models\Loan;
use App\Models\User;
use App\Support\CreditProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/** Borrowers ("clients") with their loan history, for staff. */
class ClientController extends Controller
{
    /** Client details for "Add client". Address is required; the rest is optional (unlike on an application). */
    private const PROFILE_RULES = [
        'address' => ['required', 'string', 'max:200'],
        'city' => ['nullable', 'string', 'max:120'],
        'date_of_birth' => ['nullable', 'date', 'before:today'],
        'gender' => ['nullable', 'in:female,male,non_binary,prefer_not'],
        'marital_status' => ['nullable', 'in:single,married,de_facto,divorced,widowed'],
        'employment_status' => ['nullable', 'in:employed,self_employed,casual,unemployed'],
        'employer_name' => ['nullable', 'string', 'max:160'],
        'occupation' => ['nullable', 'string', 'max:120'],
        'employment_length' => ['nullable', 'string', 'max:60'],
        'monthly_income' => ['nullable', 'numeric', 'min:0'],
        'other_income' => ['nullable', 'numeric', 'min:0'],
        'monthly_expenses' => ['nullable', 'numeric', 'min:0'],
        'existing_debts' => ['nullable', 'numeric', 'min:0'],
        'id_type' => ['nullable', 'in:national_id,drivers_licence,passport'],
        'id_number' => ['nullable', 'string', 'max:40'],
        'id_issuing_country' => ['nullable', 'string', 'size:2'],
        'id_expiry' => ['nullable', 'date'],
        'disbursement_method' => ['nullable', 'in:bank,cash_pickup'],
        'bank_name' => ['nullable', 'string', 'max:120'],
        'account_holder' => ['nullable', 'string', 'max:160'],
        'account_type' => ['nullable', 'in:savings,checking'],
        'account_number' => ['nullable', 'string', 'max:40'],
        'notes' => ['nullable', 'string', 'max:2000'],
    ];

    public function index(Request $request)
    {
        $filters = $request->only('search', 'country', 'standing');

        $clients = User::where('role', 'borrower')
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")->orWhere('phone', 'like', "%{$s}%")))
            ->when($filters['country'] ?? null, fn ($q, $c) => $q->where('country', $c))
            ->when(($filters['standing'] ?? null) === 'overdue', fn ($q) => $q->whereHas('loans.installments', fn ($i) => $i->whereColumn('amount_paid', '<', 'amount_due')->whereDate('due_date', '<', today())))
            ->when(($filters['standing'] ?? null) === 'active', fn ($q) => $q->whereHas('loans', fn ($l) => $l->where('status', 'active')))
            ->withCount(['applications', 'loans', 'loans as active_loans_count' => fn ($q) => $q->where('status', 'active')])
            ->withExists(['loans as is_overdue' => fn ($q) => $q->whereHas('installments', fn ($i) => $i->whereColumn('amount_paid', '<', 'amount_due')->whereDate('due_date', '<', today()))])
            ->addSelect(['outstanding' => Loan::selectRaw('coalesce(sum(total_payable - amount_paid), 0)')->whereColumn('user_id', 'users.id')->where('status', 'active')])
            ->latest()
            ->paginate(20)
            ->withQueryString();
        // ponytail: a few queries per row for the score; fine at 20 rows a page, store the score if lists get big.
        $countries = CountrySetting::all()->keyBy('code');
        $clients->through(fn (User $u) => [...$u->toArray(), 'credit' => CreditProfile::for($u)->summary($countries[$u->country] ?? null)]);

        return Inertia::render('Admin/Clients/Index', ['filters' => $filters, 'clients' => $clients]);
    }

    /**
     * Add an existing client without them registering. They get a random password; with "invite" they're emailed
     * the reset-password link so they can set their own and see their loans in the client portal.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:40'],
            'country' => ['required', Rule::in(CountrySetting::pluck('code'))],
            'invite' => ['boolean'],
            ...self::PROFILE_RULES,
        ]);
        $user = User::create([
            ...collect($data)->only('name', 'email', 'phone', 'country')->all(),
            // Only what was filled in; same keys as an application so the client page shows it the same way.
            'profile' => collect($data)->only(array_keys(self::PROFILE_RULES))->reject(fn ($v) => $v === null || $v === '')->all(),
            'password' => Str::random(40),
            'role' => 'borrower',
            'locale' => 'es',
        ]);
        if ($request->boolean('invite')) {
            Password::sendResetLink(['email' => $user->email]);
        }

        return redirect("/admin/clients/{$user->id}")->with('success', __('Client added.'));
    }

    public function show(User $user)
    {
        abort_unless($user->role === 'borrower', 404);
        $latest = $user->applications()->latest()->first();

        return Inertia::render('Admin/Clients/Show', [
            'client' => $user->only('id', 'name', 'email', 'phone', 'country', 'is_active', 'created_at'),
            'credit' => CreditProfile::for($user)->summary(CountrySetting::firstWhere('code', $user->country)),
            // Profile comes from the most recent application, which holds the full KYC details;
            // for a client added by hand with no application yet, from the details staff entered.
            'profile' => $latest ? [
                ...$latest->toArray(),
                'id_number' => $latest->id_number,
                'account_number' => $latest->account_number,
            ] : ($user->profile ? [
                ...$user->profile,
                'full_name' => $user->name,
                'country' => $user->country,
                'currency' => CountrySetting::where('code', $user->country)->value('currency'),
                'reference' => null,
            ] : null),
            'applications' => $user->applications()->latest()->get(['id', 'reference', 'loan_type', 'amount', 'currency', 'term_months', 'repayment_frequency', 'status', 'created_at']),
            'loans' => $user->loans()->latest()
                ->withCount(['installments as overdue_count' => fn ($i) => $i->whereColumn('amount_paid', '<', 'amount_due')->whereDate('due_date', '<', today())])
                ->with(['installments' => fn ($q) => $q->whereColumn('amount_paid', '<', 'amount_due')->limit(1)])
                ->get(),
            'payments' => \App\Models\Payment::whereIn('loan_id', $user->loans()->pluck('id'))
                ->with('loan:id,reference,currency')->latest('paid_on')->latest('id')->limit(50)->get(),
        ]);
    }
}
