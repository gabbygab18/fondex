<?php

namespace App\Support;

use App\Models\CountrySetting;
use App\Models\Installment;
use App\Models\User;

/**
 * A client's internal credit score and borrowing limit, worked out from their own repayment history.
 *
 * Score (0–100): each installment that is due or paid counts once. Paid on or before its due date = 1,
 * paid late = ½, still unpaid past its due date = 0. No installments due yet = no score ("new").
 *
 * Limit: new clients may borrow up to the country's starting limit. After a client pays off a loan as a good payer
 * (score 75+, nothing overdue), the limit goes up to their last loan × (1 + increase %), never above the country maximum.
 */
final class CreditProfile
{
    public const GOOD = 75;

    private function __construct(
        private readonly User $user,
        public readonly ?int $score,
        public readonly bool $hasOverdue,
    ) {}

    public static function for(User $user): self
    {
        $items = Installment::whereIn('loan_id', $user->loans()->select('id'))->get(['due_date', 'amount_due', 'amount_paid', 'paid_at']);
        $today = today();
        $points = 0.0;
        $counted = 0;
        $overdue = false;

        foreach ($items as $i) {
            $paid = $i->amount_paid >= $i->amount_due;
            if (! $paid && ! $i->due_date->lt($today)) {
                continue; // not due yet
            }
            $counted++;
            if ($paid) {
                $points += $i->paid_at && $i->paid_at->startOfDay()->gt($i->due_date) ? 0.5 : 1;
            } else {
                $overdue = true;
            }
        }

        return new self($user, $counted ? (int) round(100 * $points / $counted) : null, $overdue);
    }

    public function label(): string
    {
        return match (true) {
            $this->score === null => 'new',
            $this->score >= 90 => 'excellent',
            $this->score >= self::GOOD => 'good',
            $this->score >= 50 => 'fair',
            default => 'poor',
        };
    }

    public function isGoodPayer(): bool
    {
        return $this->score !== null && $this->score >= self::GOOD && ! $this->hasOverdue;
    }

    /** What the client may borrow now in this country. */
    public function limit(CountrySetting $c): float
    {
        $last = $this->user->loans()->where('currency', $c->currency)->where('status', 'paid')->latest('id')->value('principal');

        return $this->capped($c, $last && $this->isGoodPayer() ? $this->raised($c, (float) $last) : $this->start($c));
    }

    /** What they unlock by paying off their current (or last) loan on time. */
    public function nextLimit(CountrySetting $c): float
    {
        $last = $this->user->loans()->where('currency', $c->currency)->latest('id')->value('principal');

        return $this->capped($c, $last ? $this->raised($c, (float) $last) : $this->start($c));
    }

    /** Score, label and limits for the screens. */
    public function summary(?CountrySetting $c): array
    {
        return [
            'score' => $this->score,
            'label' => $this->label(),
            'good' => $this->isGoodPayer(),
            'currency' => $c?->currency,
            'limit' => $c ? $this->limit($c) : null,
            'next_limit' => $c ? $this->nextLimit($c) : null,
            'start' => $c ? $this->capped($c, $this->start($c)) : null,
        ];
    }

    private function start(CountrySetting $c): float
    {
        return $c->starting_limit ?: $c->max_amount;
    }

    private function raised(CountrySetting $c, float $last): float
    {
        return max($this->start($c), $last * (1 + $c->limit_increase_pct / 100));
    }

    private function capped(CountrySetting $c, float $v): float
    {
        return min(max($v, $c->min_amount), $c->max_amount);
    }
}
