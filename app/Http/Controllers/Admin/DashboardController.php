<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Installment;
use App\Models\Loan;
use App\Models\LoanApplication;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke()
    {
        $byStatus = LoanApplication::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        // One row per currency: ARS and COP never get summed together.
        $portfolio = Loan::selectRaw("currency, count(*) as loans, sum(principal) as disbursed, sum(amount_paid) as collected, sum(total_payable - amount_paid) as outstanding")
            ->groupBy('currency')->get();

        $overdue = Installment::with('loan:id,reference,currency,user_id', 'loan.user:id,name')
            ->whereColumn('amount_paid', '<', 'amount_due')
            ->whereDate('due_date', '<', today())
            ->orderBy('due_date')->limit(8)->get();

        $months = collect(range(5, 0))->map(fn ($i) => now()->startOfMonth()->subMonths($i));
        $perMonth = LoanApplication::where('created_at', '>=', $months->first())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as ym, count(*) as total")
            ->groupBy('ym')->pluck('total', 'ym');

        return Inertia::render('Admin/Dashboard', [
            'byStatus' => $byStatus,
            'portfolio' => $portfolio,
            'overdue' => $overdue,
            'trend' => $months->map(fn ($m) => ['month' => $m->format('Y-m'), 'total' => (int) ($perMonth[$m->format('Y-m')] ?? 0)]),
            'recent' => LoanApplication::with('user:id,name')->latest()->limit(6)->get(),
        ]);
    }
}
