<?php

use App\Models\Loan;
use App\Notifications\PaymentReminder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/**
 * Email payment reminders. At most one email per loan per day, for its most urgent installment
 * (see Installment::reminderKind for when each kind is sent).
 */
Artisan::command('loans:remind', function () {
    $sent = 0;
    Loan::where('status', 'active')->with('user')->each(function (Loan $loan) use (&$sent) {
        $open = $loan->installments()->whereColumn('amount_paid', '<', 'amount_due')->whereDate('due_date', '<=', today()->addDay())->get();
        if ($open->contains(fn ($i) => $i->reminded_on?->isToday())) {
            return;
        }
        foreach ($open as $inst) {
            $inst->setRelation('loan', $loan);
            if ($kind = $inst->reminderKind()) {
                $loan->user->notify(new PaymentReminder($inst, $kind));
                $inst->forceFill(['reminded_on' => today()])->save();
                $sent++;
                break;
            }
        }
    });
    $this->info("Sent {$sent} reminder(s).");
})->purpose('Email borrowers about upcoming and overdue installments');

// Needs the scheduler running on the server: `* * * * * php artisan schedule:run` (cron) or `php artisan schedule:work`.
Schedule::command('loans:remind')->dailyAt('09:00');
