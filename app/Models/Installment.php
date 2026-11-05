<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Installment extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $appends = ['status'];

    protected function casts(): array
    {
        return [
            'due_date' => 'date:Y-m-d',
            'paid_at' => 'datetime',
            'reminded_on' => 'date:Y-m-d',
            'principal' => 'float',
            'interest' => 'float',
            'amount_due' => 'float',
            'amount_paid' => 'float',
        ];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * Which reminder this installment should get today, if any.
     * Weekly/fortnightly: the day before, on the day, then 1, 3 and 7 days late.
     * Daily: only when late (a reminder for every daily installment would be spam).
     */
    public function reminderKind(): ?string
    {
        if ($this->amount_paid >= $this->amount_due) {
            return null;
        }
        $days = (int) round(today()->diffInDays($this->due_date, false));

        return match (true) {
            $days < 0 && in_array(-$days, [1, 3, 7], true) => 'overdue',
            $this->loan->repayment_frequency === 'daily' => null,
            $days === 0 => 'due_today',
            $days === 1 => 'upcoming',
            default => null,
        };
    }

    public function getStatusAttribute(): string
    {
        return match (true) {
            $this->amount_paid >= $this->amount_due => 'paid',
            $this->due_date->lt(today()) => 'overdue',
            $this->amount_paid > 0 => 'partial',
            default => 'upcoming',
        };
    }
}
