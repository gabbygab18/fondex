<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\CountrySetting;
use App\Models\LoanApplication;
use App\Notifications\ApplicationStatusChanged;
use App\Support\CreditProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ApplicationController extends Controller
{
    public const FILTERS = ['search', 'country', 'status', 'from', 'to'];

    public function index(Request $request)
    {
        $filters = $request->only(self::FILTERS);

        return Inertia::render('Admin/Applications/Index', [
            'filters' => $filters,
            'applications' => LoanApplication::with('user:id,name,email')
                ->filter($filters)
                ->latest()
                ->paginate(15)
                ->withQueryString(),
        ]);
    }

    public function show(LoanApplication $application)
    {
        return Inertia::render('Admin/Applications/Show', [
            // Staff see the full ID and bank numbers: they need them to verify identity and disburse.
            'application' => [
                ...$application->load('user:id,name,email,phone', 'documents', 'reviewer:id,name', 'loan:id,loan_application_id,reference')->toArray(),
                'id_number' => $application->id_number,
                'account_number' => $application->account_number,
            ],
            'rates' => config('loan.rates'),
            'credit' => CreditProfile::for($application->user)->summary(CountrySetting::firstWhere('code', $application->country)),
            'otherApplications' => LoanApplication::where('user_id', $application->user_id)
                ->whereKeyNot($application->id)->latest()->get(['id', 'reference', 'amount', 'currency', 'status', 'created_at']),
        ]);
    }

    public function update(Request $request, LoanApplication $application)
    {
        if (! $application->isOpen()) {
            return back()->with('error', 'This application has already been decided.');
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['under_review', 'approved', 'rejected'])],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
            'disbursed_at' => ['nullable', 'date'],
            'interest_rate' => ['required_if:status,approved', 'nullable', Rule::in(config('loan.rates'))],
        ]);

        // One loan at a time, also for applications sent before the current loan started.
        if ($data['status'] === 'approved' && $application->user->hasOngoingLoan()) {
            return back()->with('error', __('This client already has a loan in progress. Approve once it is fully paid, or reject this application.'));
        }

        DB::transaction(function () use ($application, $data, $request) {
            $application->update([
                'status' => $data['status'],
                'admin_notes' => $data['admin_notes'] ?? $application->admin_notes,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'interest_rate' => $data['status'] === 'approved' ? $data['interest_rate'] : null,
            ]);

            if ($data['status'] === 'approved') {
                Loan::createFromApplication($application, (float) $data['interest_rate'], isset($data['disbursed_at']) ? now()->parse($data['disbursed_at']) : null);
            }
        });

        $application->user->notify(new ApplicationStatusChanged($application));

        return back()->with('success', 'Application updated and applicant notified.');
    }
}
