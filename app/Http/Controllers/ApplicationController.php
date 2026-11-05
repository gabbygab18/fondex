<?php

namespace App\Http\Controllers;

use App\Models\ApplicationDocument;
use App\Models\CountrySetting;
use App\Models\LoanApplication;
use App\Notifications\ApplicationReceived;
use App\Support\CreditProfile;
use App\Support\LoanMath;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ApplicationController extends Controller
{
    private const FILE_RULE = ['file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:8192'];

    /** One loan at a time: back to the account with the reason. */
    private function ongoingLoan()
    {
        return redirect('/account')->with('error', __('You have a loan in progress. You can apply for a new one once it is fully paid.'));
    }

    public function create(Request $request)
    {
        if ($request->user()->hasOngoingLoan()) {
            return $this->ongoingLoan();
        }

        return Inertia::render('Apply', [
            'prefill' => [
                'amount' => $request->integer('amount') ?: null,
                'term' => $request->integer('term') ?: null,
                'frequency' => $request->query('frequency'),
                'country' => $request->query('country'),
                'loan_type' => in_array($request->query('type'), LoanApplication::LOAN_TYPES, true) ? $request->query('type') : null,
            ],
            'rates' => config('loan.rates'),
            // The most this client may borrow in each country (their credit limit).
            'limits' => CountrySetting::where('is_active', true)->get()
                ->mapWithKeys(fn ($c) => [$c->code => CreditProfile::for($request->user())->limit($c)]),
        ]);
    }

    public function store(Request $request)
    {
        if ($request->user()->hasOngoingLoan()) {
            return $this->ongoingLoan();
        }

        foreach (['other_income', 'existing_debts'] as $field) {
            if (blank($request->input($field))) {
                $request->merge([$field => 0]);
            }
        }
        $country = CountrySetting::where('code', $request->input('country'))->where('is_active', true)->first();
        $money = ['numeric', 'min:0', 'max:9999999999999'];

        $data = $request->validate([
            'country' => ['required', Rule::in(['AR', 'CO'])],
            // 4. Loan details
            'loan_type' => ['required', Rule::in(LoanApplication::LOAN_TYPES)],
            'amount' => ['required', 'numeric', 'min:'.($country->min_amount ?? 0), 'max:'.($country ? CreditProfile::for($request->user())->limit($country) : 0)],
            'term_months' => ['required', 'integer', 'min:'.max(1, $country->min_term ?? 1), 'max:'.min(12, $country->max_term ?? 3)],
            'repayment_frequency' => ['required', Rule::in(LoanMath::FREQUENCIES)],
            'purpose' => ['required', 'string', 'max:160'],
            // 1. Personal
            'full_name' => ['required', 'string', 'max:160'],
            'date_of_birth' => ['required', 'date', 'before_or_equal:'.now()->subYears(18)->toDateString(), 'after:1900-01-01'],
            'gender' => ['nullable', Rule::in(['female', 'male', 'non_binary', 'prefer_not'])],
            'marital_status' => ['nullable', Rule::in(['single', 'married', 'de_facto', 'divorced', 'widowed'])],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['required', 'string', 'max:40'],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            // 2. Employment
            'employment_status' => ['required', Rule::in(LoanApplication::EMPLOYMENT)],
            'employer_name' => ['nullable', 'required_unless:employment_status,unemployed', 'string', 'max:160'],
            'occupation' => ['nullable', 'required_unless:employment_status,unemployed', 'string', 'max:120'],
            'employment_length' => ['nullable', 'string', 'max:60'],
            // 3. Financial
            'monthly_income' => ['required', ...$money],
            'other_income' => ['nullable', ...$money],
            'other_income_source' => ['nullable', 'string', 'max:160'],
            'monthly_expenses' => ['required', ...$money],
            'existing_debts' => ['nullable', ...$money],
            'other_commitments' => ['nullable', 'string', 'max:1000'],
            // 5. Identification
            'id_type' => ['required', Rule::in(LoanApplication::ID_TYPES)],
            'id_number' => ['required', 'string', 'max:60'],
            'id_issuing_country' => ['required', 'string', 'size:2'],
            'id_expiry' => ['nullable', 'date', 'after:today'],
            'id_front' => ['required', ...self::FILE_RULE],
            'id_back' => ['nullable', ...self::FILE_RULE],
            'address_proof' => ['required', ...self::FILE_RULE],
            'income_proof' => ['nullable', ...self::FILE_RULE],
            'other' => ['nullable', ...self::FILE_RULE],
            // 6. Disbursement: bank transfer or cash pick-up. Bank details only for a transfer (and dropped otherwise):
            // Argentina pays to a CBU/CVU (22 digits) or alias; Colombia to a savings/checking account.
            'disbursement_method' => ['required', Rule::in(LoanApplication::DISBURSEMENT_METHODS)],
            'bank_name' => ['exclude_unless:disbursement_method,bank', 'required', 'string', 'max:120'],
            'account_holder' => ['exclude_unless:disbursement_method,bank', 'required', 'string', 'max:160'],
            'account_type' => ['exclude_unless:disbursement_method,bank', Rule::requiredIf($request->input('country') === 'CO'), 'nullable', Rule::in(['savings', 'checking'])],
            'account_number' => ['exclude_unless:disbursement_method,bank', 'required', 'string', 'max:40', $request->input('country') === 'AR' ? 'regex:/^(\d{22}|[a-zA-Z0-9.\-]{6,20})$/' : 'regex:/^[\d\-]{6,20}$/'],
            // 7. Consents
            'consent_privacy' => ['accepted'],
            'consent_data_use' => ['accepted'],
            'consent_credit_check' => ['accepted'],
            'declaration_accurate' => ['accepted'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ], [
            'account_number.regex' => $request->input('country') === 'AR'
                ? __('Enter a 22-digit CBU/CVU or a valid alias.')
                : __('Enter a valid account number (digits only).'),
            'date_of_birth.before_or_equal' => __('You must be 18 or older to apply.'),
        ]);

        $user = $request->user();

        $application = DB::transaction(function () use ($data, $country, $user, $request) {
            $app = $user->applications()->create([
                ...collect($data)->except(ApplicationDocument::TYPES)->all(),
                'currency' => $country->currency,
                'consented_at' => now(),
                'consent_ip' => $request->ip(),
            ]);

            foreach (ApplicationDocument::TYPES as $type) {
                if ($file = $request->file($type)) {
                    $app->documents()->create([
                        'type' => $type,
                        'path' => $file->store("applications/{$app->id}", 'local'),
                        'original_name' => $file->getClientOriginalName(),
                        'mime' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ]);
                }
            }

            return $app;
        });

        $application->load('user');
        $user->notify(new ApplicationReceived($application));
        Notification::route('mail', config('loan.admin_email'))->notify(new ApplicationReceived($application, forAdmin: true));

        return redirect("/account/applications/{$application->id}")
            ->with('success', __('Application submitted. We emailed you a confirmation.'));
    }

    public function show(Request $request, LoanApplication $application)
    {
        abort_unless($application->user_id === $request->user()->id, 404);

        return Inertia::render('Account/Application', [
            'application' => [
                ...$application->load('documents', 'loan:id,loan_application_id')->toArray(),
                'account_number_masked' => $application->masked('account_number'),
            ],
        ]);
    }

    /** Documents live on the private disk; only the owner or staff may download them. */
    public function document(Request $request, ApplicationDocument $document)
    {
        $user = $request->user();
        abort_unless($user->isStaff() || $document->application->user_id === $user->id, 404);

        return Storage::disk('local')->response($document->path, $document->original_name);
    }
}
