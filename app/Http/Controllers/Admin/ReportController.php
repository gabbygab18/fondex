<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\LoanApplication;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Reports', [
            'byCountry' => LoanApplication::selectRaw("country, status, count(*) as total, sum(amount) as amount")
                ->groupBy('country', 'status')->get(),
            'collections' => Payment::join('loans', 'loans.id', '=', 'payments.loan_id')
                ->where('paid_on', '>=', now()->startOfMonth()->subMonths(5))
                ->selectRaw("loans.currency, DATE_FORMAT(paid_on, '%Y-%m') as ym, sum(amount) as total")
                ->groupBy('loans.currency', 'ym')->orderBy('ym')->get(),
        ]);
    }

    /** CSV opens directly in Excel; the BOM makes Excel read accents (ñ, á) correctly. */
    public function export(Request $request)
    {
        $request->validate(['type' => ['required', Rule::in(['applications', 'loans', 'payments'])]]);
        $filters = $request->only(ApplicationController::FILTERS);
        $type = $request->input('type');

        [$header, $rows] = match ($type) {
            'applications' => [
                ['Reference', 'Date', 'Applicant', 'Email', 'Phone', 'Country', 'Currency', 'Loan type', 'Amount', 'Term (months)', 'Frequency', 'Rate %', 'Purpose', 'Employment', 'Monthly income', 'Monthly expenses', 'Status'],
                LoanApplication::with('user:id,name,email')->filter($filters)->latest()->lazy()->map(fn ($a) => [
                    $a->reference, $a->created_at->toDateString(), $a->full_name, $a->email, $a->phone, $a->country, $a->currency, $a->loan_type,
                    $a->amount, $a->term_months, $a->repayment_frequency, $a->interest_rate, $a->purpose, $a->employment_status, $a->monthly_income, $a->monthly_expenses, $a->status,
                ]),
            ],
            'loans' => [
                ['Reference', 'Disbursed', 'Borrower', 'Email', 'Country', 'Currency', 'Principal', 'Flat rate %', 'Term (months)', 'Frequency', 'Installments', 'Installment', 'Total payable', 'Paid', 'Outstanding', 'Status'],
                Loan::with('user:id,name,email')->filter($filters)->latest()->lazy()->map(fn ($l) => [
                    $l->reference, $l->disbursed_at->toDateString(), $l->user->name, $l->user->email, $l->country, $l->currency,
                    $l->principal, $l->interest_rate, $l->term_months, $l->repayment_frequency, $l->installment_count, $l->installment_amount, $l->total_payable, $l->amount_paid, $l->outstanding(), $l->status,
                ]),
            ],
            'payments' => [
                ['Date', 'Loan', 'Borrower', 'Country', 'Currency', 'Amount', 'Method', 'Reference', 'Recorded by'],
                Payment::with('loan:id,reference,country,currency,user_id', 'loan.user:id,name', 'recorder:id,name')
                    ->when($filters['country'] ?? null, fn ($q, $c) => $q->whereHas('loan', fn ($l) => $l->where('country', $c)))
                    ->when($filters['from'] ?? null, fn ($q, $d) => $q->whereDate('paid_on', '>=', $d))
                    ->when($filters['to'] ?? null, fn ($q, $d) => $q->whereDate('paid_on', '<=', $d))
                    ->latest('paid_on')->lazy()->map(fn ($p) => [
                        $p->paid_on->toDateString(), $p->loan->reference, $p->loan->user->name, $p->loan->country, $p->loan->currency,
                        $p->amount, $p->method, $p->reference, $p->recorder?->name,
                    ]),
            ],
        };

        return response()->streamDownload(function () use ($header, $rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $header);
            foreach ($rows as $row) {
                // Prefix formula-looking cells so a spreadsheet never executes them.
                fputcsv($out, array_map(fn ($v) => is_string($v) && preg_match('/^[=+\-@]/', $v) ? "'".$v : $v, $row));
            }
            fclose($out);
        }, "{$type}-".now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
