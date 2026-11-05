<?php

namespace Tests\Unit;

use App\Support\LoanMath;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\TestCase;

class LoanMathTest extends TestCase
{
    public function test_flat_rate_splits_into_equal_installments(): void
    {
        // 1,000 at 20% flat over 1 month weekly = 1,200 in 4 payments of 300.
        $rows = LoanMath::schedule(1000, 20, 1, 'weekly', Carbon::parse('2026-01-01'));

        $this->assertCount(4, $rows);
        $this->assertSame([300.0, 300.0, 300.0, 300.0], array_column($rows, 'amount_due'));
        $this->assertSame('2026-01-08', $rows[0]['due_date']);
        $this->assertSame('2026-01-29', $rows[3]['due_date']);
        $this->assertEqualsWithDelta(1000, array_sum(array_column($rows, 'principal')), 0.001);
        $this->assertEqualsWithDelta(200, array_sum(array_column($rows, 'interest')), 0.001);
    }

    public function test_installment_counts_per_frequency(): void
    {
        $this->assertSame(90, LoanMath::installmentCount(3, 'daily'));
        $this->assertSame(8, LoanMath::installmentCount(2, 'weekly'));
        $this->assertSame(6, LoanMath::installmentCount(3, 'fortnightly'));
    }

    public function test_rounding_lands_on_the_last_installment(): void
    {
        // 1,000 at 35% over 1 month daily = 1,350 / 30 = 45 each; try an amount that doesn't divide evenly.
        $rows = LoanMath::schedule(1001, 35, 1, 'daily', Carbon::parse('2026-01-01'));

        $this->assertEqualsWithDelta(1351.35, array_sum(array_column($rows, 'amount_due')), 0.001);
        $this->assertSame('2026-01-31', end($rows)['due_date']);
    }
}
