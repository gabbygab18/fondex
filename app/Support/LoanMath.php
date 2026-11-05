<?php

namespace App\Support;

use Illuminate\Support\Carbon;

/**
 * Short-term loans with a flat rate: the rate is charged once on the principal
 * (borrow 1,000 at 20% → repay 1,200), split into equal daily, weekly or fortnightly installments.
 */
class LoanMath
{
    public const FREQUENCIES = ['daily', 'weekly', 'fortnightly'];

    /** Days between installments. */
    public const PERIOD_DAYS = ['daily' => 1, 'weekly' => 7, 'fortnightly' => 14];

    /** Installments per month of term: a month counts as 30 days, 4 weeks or 2 fortnights. */
    public const PER_MONTH = ['daily' => 30, 'weekly' => 4, 'fortnightly' => 2];

    public static function installmentCount(int $months, string $frequency): int
    {
        return $months * self::PER_MONTH[$frequency];
    }

    public static function totalPayable(float $principal, float $ratePct): float
    {
        return round($principal * (1 + $ratePct / 100), 2);
    }

    public static function installmentAmount(float $principal, float $ratePct, int $months, string $frequency): float
    {
        return round(self::totalPayable($principal, $ratePct) / self::installmentCount($months, $frequency), 2);
    }

    /** @return list<array{number:int,due_date:string,principal:float,interest:float,amount_due:float}> */
    public static function schedule(float $principal, float $ratePct, int $months, string $frequency, Carbon $start): array
    {
        $n = self::installmentCount($months, $frequency);
        $total = self::totalPayable($principal, $ratePct);
        $interestTotal = round($total - $principal, 2);
        $each = round($total / $n, 2);
        $principalEach = round($principal / $n, 2);
        $rows = [];
        $paidPrincipal = $paidTotal = 0.0;

        for ($k = 1; $k <= $n; $k++) {
            // The last installment absorbs every rounding cent, so totals match exactly.
            $amount = $k === $n ? round($total - $paidTotal, 2) : $each;
            $principalPart = $k === $n ? round($principal - $paidPrincipal, 2) : $principalEach;
            $paidTotal += $amount;
            $paidPrincipal += $principalPart;
            $rows[] = [
                'number' => $k,
                'due_date' => $start->copy()->addDays($k * self::PERIOD_DAYS[$frequency])->toDateString(),
                'principal' => $principalPart,
                'interest' => round($amount - $principalPart, 2),
                'amount_due' => $amount,
            ];
        }

        return $rows;
    }
}
