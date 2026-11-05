<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashEntry;
use App\Models\CountrySetting;
use App\Models\Loan;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Accounting for the admin: money lent, money collected and interest earned, grouped by day, week, month or year,
 * plus a ledger of every disbursement and collection and of manual cash entries (expenses, capital, withdrawals).
 * One currency at a time (ARS and COP never add up).
 *
 * Interest is counted when it's collected (cash basis): each payment is split between principal and interest in
 * the loan's own proportion. A loan of 100,000 at 20% has a total of 120,000, so 1/6 of every payment is interest.
 */
class AccountingController extends Controller
{
    public const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

    private const LABELS = ['disbursement' => 'Disbursement', 'collection' => 'Collection', 'cash_in' => 'Cash in', 'cash_out' => 'Cash out'];

    public function index(Request $request)
    {
        [$period, $currency, $from, $to] = $this->filters($request);
        [$loans, $payments, $cash] = $this->entries($currency, $from, $to);

        $rows = $this->periods($period, $from, $to)->map(function ($start) use ($period, $loans, $payments, $cash) {
            $in = fn ($e) => $this->bucket($period, $e['date']) === $start;

            return ['period' => $start] + $this->sums($loans->filter($in), $payments->filter($in), $cash->filter($in));
        });

        $active = Loan::where('currency', $currency)->where('status', 'active')->get(['principal', 'total_payable', 'amount_paid']);

        return Inertia::render('Admin/Accounting', [
            'filters' => ['period' => $period, 'currency' => $currency, 'from' => $from->toDateString(), 'to' => $to->toDateString()],
            'currencies' => $this->currencies(),
            'totals' => $this->sums($loans, $payments, $cash),
            'categories' => CashEntry::CATEGORIES,
            // For a "Loan payment" cash entry, which is saved as a real payment on the loan (updates the client portal).
            'activeLoans' => Loan::with('user:id,name')->where('status', 'active')->orderBy('reference')->get()
                ->map(fn ($l) => ['id' => $l->id, 'reference' => $l->reference, 'currency' => $l->currency, 'borrower' => $l->user->name, 'outstanding' => $l->outstanding()]),
            'methods' => \App\Models\Payment::METHODS,
            'outstanding' => [
                'balance' => round($active->sum(fn ($l) => $l->total_payable - $l->amount_paid), 2),
                // Interest still to come in on active loans, in the same proportion as collections.
                'interest' => round($active->sum(fn ($l) => ($l->total_payable - $l->amount_paid) * $this->interestShare($l->principal, $l->total_payable)), 2),
                'loans' => $active->count(),
            ],
            // All-time capital for this currency (not limited to the dates picked).
            'capital' => [
                'in' => (float) CashEntry::where('currency', $currency)->where('category', 'capital')->sum('amount'),
                'out' => (float) CashEntry::where('currency', $currency)->where('category', 'withdrawal')->sum('amount'),
            ],
            'rows' => $rows->reverse()->values(),
            // ponytail: newest 200 entries on screen; the CSV has them all.
            'ledger' => $this->ledger($loans, $payments, $cash)->take(200)->values(),
        ]);
    }

    /** A manual cash book entry. Loan payments are recorded on the loan instead, so its balance and installments update. */
    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date', 'before_or_equal:today'],
            'currency' => ['required', Rule::in($this->currencies())],
            'direction' => ['required', Rule::in(['in', 'out'])],
            'category' => ['required', Rule::in(CashEntry::CATEGORIES[$request->input('direction')] ?? [])],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:9999999999999'],
        ]);
        CashEntry::create($data + ['recorded_by' => $request->user()->id]);

        return back()->with('success', __('Entry added.'));
    }

    public function destroy(CashEntry $entry)
    {
        $entry->delete();

        return back()->with('success', __('Entry deleted.'));
    }

    public function export(Request $request)
    {
        [, $currency, $from, $to] = $this->filters($request);
        $rows = $this->ledger(...$this->entries($currency, $from, $to));

        return response()->streamDownload(function () use ($rows, $currency) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Date', 'Entry', 'Category', 'Loan', 'Borrower / description', 'Currency', 'Money in', 'Money out', 'Principal', 'Interest', 'Method']);
            $safe = fn ($v) => is_string($v) ? preg_replace('/^[=+\-@]/', "'$0", $v) : $v;
            foreach ($rows as $r) {
                $isOut = in_array($r['type'], ['disbursement', 'cash_out'], true);
                fputcsv($out, array_map($safe, [$r['date'], self::LABELS[$r['type']], $r['category'] ?? '', $r['loan'], $r['borrower'], $currency,
                    $isOut ? '' : $r['amount'], $isOut ? $r['amount'] : '', $r['principal'], $r['interest'], $r['method']]));
            }
            fclose($out);
        }, "accounting-{$currency}-".now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** [period, currency, from, to] from the query, with a sensible default range for each period. */
    private function filters(Request $request): array
    {
        $request->validate(['from' => ['nullable', 'date'], 'to' => ['nullable', 'date', 'after_or_equal:from']]);
        $period = in_array($request->query('period'), self::PERIODS, true) ? $request->query('period') : 'monthly';
        $currencies = $this->currencies();
        $currency = in_array($request->query('currency'), $currencies, true) ? $request->query('currency') : ($currencies[0] ?? 'ARS');
        $to = CarbonImmutable::parse($request->query('to') ?: 'today');
        $from = $request->query('from') ? CarbonImmutable::parse($request->query('from')) : match ($period) {
            'daily' => $to->subDays(29),
            'weekly' => $to->subWeeks(11)->startOfWeek(),
            'monthly' => $to->subMonths(11)->startOfMonth(),
            'yearly' => $to->subYears(4)->startOfYear(),
        };

        return [$period, $currency, $from, $to];
    }

    /** Disbursements, collections and manual cash entries in the range, as plain arrays. */
    private function entries(string $currency, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $loans = Loan::with('user:id,name')->where('currency', $currency)
            ->whereDate('disbursed_at', '>=', $from->toDateString())->whereDate('disbursed_at', '<=', $to->toDateString())->get()
            ->map(fn ($l) => ['id' => $l->id, 'loan_id' => $l->id, 'user_id' => $l->user_id, 'date' => $l->disbursed_at->toDateString(), 'loan' => $l->reference, 'borrower' => $l->user->name,
                'amount' => (float) $l->principal, 'interest_booked' => round($l->total_payable - $l->principal, 2)]);

        // ponytail: grouped in PHP (portable across MariaDB and the SQLite tests); move to SQL GROUP BY past ~100k payments.
        $payments = Payment::with('loan:id,reference,principal,total_payable,user_id', 'loan.user:id,name')
            ->whereHas('loan', fn ($q) => $q->where('currency', $currency))
            ->whereDate('paid_on', '>=', $from->toDateString())->whereDate('paid_on', '<=', $to->toDateString())->get()
            ->map(function ($p) {
                $interest = round($p->amount * $this->interestShare($p->loan->principal, $p->loan->total_payable), 2);

                return ['id' => $p->id, 'loan_id' => $p->loan_id, 'user_id' => $p->loan->user_id, 'date' => $p->paid_on->toDateString(), 'loan' => $p->loan->reference, 'borrower' => $p->loan->user->name,
                    'amount' => (float) $p->amount, 'interest' => $interest, 'principal' => round($p->amount - $interest, 2), 'method' => $p->method];
            });

        $cash = CashEntry::where('currency', $currency)->whereDate('date', '>=', $from->toDateString())->whereDate('date', '<=', $to->toDateString())->get()
            ->map(fn ($c) => ['id' => $c->id, 'date' => $c->date->toDateString(), 'direction' => $c->direction, 'category' => $c->category,
                'description' => $c->description, 'amount' => $c->amount]);

        return [$loans, $payments, $cash];
    }

    private function currencies(): array
    {
        return CountrySetting::orderBy('currency')->distinct()->pluck('currency')->all();
    }

    private function interestShare(float $principal, float $total): float
    {
        return $total > 0 ? ($total - $principal) / $total : 0;
    }

    private function sums(Collection $loans, Collection $payments, Collection $cash): array
    {
        $collected = round($payments->sum('amount'), 2);
        $lent = round($loans->sum('amount'), 2);
        $cashIn = round($cash->where('direction', 'in')->sum('amount'), 2);
        $cashOut = round($cash->where('direction', 'out')->sum('amount'), 2);

        return [
            'lent' => $lent,
            'loans' => $loans->count(),
            'interest_booked' => round($loans->sum('interest_booked'), 2),
            'collected' => $collected,
            'payments' => $payments->count(),
            'principal' => round($payments->sum('principal'), 2),
            'interest' => round($payments->sum('interest'), 2),
            'cash_in' => $cashIn,
            'cash_out' => $cashOut,
            // Everything that came in minus everything that went out.
            'net' => round($collected + $cashIn - $lent - $cashOut, 2),
        ];
    }

    /** First day of the period a date falls in (weeks start on Monday). */
    private function bucket(string $period, string $date): string
    {
        $d = CarbonImmutable::parse($date);

        return (match ($period) {
            'daily' => $d,
            'weekly' => $d->startOfWeek(),
            'monthly' => $d->startOfMonth(),
            'yearly' => $d->startOfYear(),
        })->toDateString();
    }

    /** Every period start from $from to $to, so quiet days still show as a zero row. */
    private function periods(string $period, CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        $step = ['daily' => 'addDay', 'weekly' => 'addWeek', 'monthly' => 'addMonth', 'yearly' => 'addYear'][$period];
        $out = collect();
        for ($d = CarbonImmutable::parse($this->bucket($period, $from->toDateString())); $d <= $to; $d = $d->$step()) {
            $out->push($d->toDateString());
        }

        return $out;
    }

    /** Disbursements and cash out (money out), collections and cash in (money in), newest first. */
    private function ledger(Collection $loans, Collection $payments, Collection $cash): Collection
    {
        return $loans->map(fn ($l) => ['key' => "d{$l['id']}", 'type' => 'disbursement', 'loan_id' => $l['loan_id'], 'user_id' => $l['user_id'], 'date' => $l['date'], 'loan' => $l['loan'], 'borrower' => $l['borrower'],
            'amount' => $l['amount'], 'principal' => $l['amount'], 'interest' => 0, 'method' => null])
            ->concat($payments->map(fn ($p) => ['key' => "p{$p['id']}", 'type' => 'collection'] + $p))
            ->concat($cash->map(fn ($c) => ['key' => "c{$c['id']}", 'id' => $c['id'], 'type' => "cash_{$c['direction']}", 'date' => $c['date'], 'category' => $c['category'],
                'loan' => null, 'borrower' => $c['description'], 'amount' => $c['amount'], 'principal' => null, 'interest' => null, 'method' => null]))
            ->sortByDesc(fn ($e) => $e['date'].($e['type'] === 'collection' ? '1' : '0'))->values();
    }
}
