<?php

namespace App\Models;

use App\Support\LoanMath;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class Loan extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'principal' => 'float',
            'interest_rate' => 'float',
            'installment_amount' => 'float',
            'total_payable' => 'float',
            'amount_paid' => 'float',
            'disbursed_at' => 'date:Y-m-d',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(LoanApplication::class, 'loan_application_id');
    }

    public function installments(): HasMany
    {
        return $this->hasMany(Installment::class)->orderBy('number');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest('paid_on')->latest('id');
    }

    public function scopeFilter(Builder $query, array $f): void
    {
        $query
            ->when($f['search'] ?? null, fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('reference', 'like', "%{$s}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))))
            ->when($f['country'] ?? null, fn ($q, $c) => $q->where('country', $c))
            ->when($f['status'] ?? null, fn ($q, $s) => $s === 'overdue'
                ? $q->whereHas('installments', fn ($i) => $i->whereColumn('amount_paid', '<', 'amount_due')->whereDate('due_date', '<', today()))
                : $q->where('status', $s))
            ->when($f['from'] ?? null, fn ($q, $d) => $q->whereDate('disbursed_at', '>=', $d))
            ->when($f['to'] ?? null, fn ($q, $d) => $q->whereDate('disbursed_at', '<=', $d));
    }

    public function outstanding(): float
    {
        return round($this->total_payable - $this->amount_paid, 2);
    }

    /** Turn an approved application into a loan at the flat rate the admin chose, with its full schedule. */
    public static function createFromApplication(LoanApplication $app, float $ratePct, ?Carbon $disbursedAt = null): self
    {
        return self::open([
            'reference' => 'LN-'.str_pad($app->id, 6, '0', STR_PAD_LEFT),
            'loan_application_id' => $app->id,
            'user_id' => $app->user_id,
            'country' => $app->country,
            'currency' => $app->currency,
            'principal' => $app->amount,
            'interest_rate' => $ratePct,
            'term_months' => $app->term_months,
            'repayment_frequency' => $app->repayment_frequency,
            'disbursed_at' => $disbursedAt ?? now(),
        ]);
    }

    /** Create a loan with its full installment schedule. Also used for existing loans added by hand (no application). */
    public static function open(array $attributes): self
    {
        $start = Carbon::parse($attributes['disbursed_at']);
        $schedule = LoanMath::schedule($attributes['principal'], $attributes['interest_rate'], $attributes['term_months'], $attributes['repayment_frequency'], $start);

        return DB::transaction(function () use ($attributes, $schedule) {
            $loan = self::create([
                ...$attributes,
                'installment_count' => count($schedule),
                'installment_amount' => $schedule[0]['amount_due'],
                'total_payable' => LoanMath::totalPayable($attributes['principal'], $attributes['interest_rate']),
            ]);
            $loan->installments()->createMany($schedule);

            return $loan;
        });
    }

    /** The oldest installment that still has something owing. */
    public function nextInstallment(): ?Installment
    {
        return $this->installments()->whereColumn('amount_paid', '<', 'amount_due')->first();
    }

    /** Record a payment and allocate it to the oldest unpaid installments first. */
    public function recordPayment(float $amount, array $attributes): Payment
    {
        return DB::transaction(function () use ($amount, $attributes) {
            $payment = $this->payments()->create(['amount' => $amount, ...$attributes]);

            $left = $amount;
            $open = $this->installments()->whereColumn('amount_paid', '<', 'amount_due')->lockForUpdate()->get();
            foreach ($open as $inst) {
                if ($left <= 0) {
                    break;
                }
                $apply = min($left, round($inst->amount_due - $inst->amount_paid, 2));
                $inst->amount_paid = round($inst->amount_paid + $apply, 2);
                if ($inst->amount_paid >= $inst->amount_due) {
                    $inst->paid_at = $payment->paid_on;
                }
                $inst->save();
                $left = round($left - $apply, 2);
            }

            $this->amount_paid = round($this->amount_paid + $amount, 2);
            $this->status = $this->outstanding() <= 0 ? 'paid' : 'active';
            $this->save();

            return $payment;
        });
    }
}
