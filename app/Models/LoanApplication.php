<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LoanApplication extends Model
{
    public const STATUSES = ['pending', 'under_review', 'approved', 'rejected'];

    protected $guarded = ['id'];

    // Personal lending only: Fondex does not offer business loans.
    public const LOAN_TYPES = ['personal', 'emergency', 'debt_consolidation', 'education', 'medical', 'home_improvement', 'vehicle'];

    public const EMPLOYMENT = ['employed', 'self_employed', 'casual', 'unemployed'];

    public const DISBURSEMENT_METHODS = ['bank', 'cash_pickup'];

    public const ID_TYPES = ['national_id', 'drivers_licence', 'passport'];

    protected $hidden = ['id_number', 'account_number'];

    protected function casts(): array
    {
        return [
            'amount' => 'float',
            'monthly_income' => 'float',
            'other_income' => 'float',
            'monthly_expenses' => 'float',
            'existing_debts' => 'float',
            'interest_rate' => 'float',
            'date_of_birth' => 'date:Y-m-d',
            'id_expiry' => 'date:Y-m-d',
            // Sensitive numbers are encrypted in the database with APP_KEY.
            'id_number' => 'encrypted',
            'account_number' => 'encrypted',
            'consent_privacy' => 'boolean',
            'consent_data_use' => 'boolean',
            'consent_credit_check' => 'boolean',
            'declaration_accurate' => 'boolean',
            'consented_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    /** Last four digits only, for screens that don't need the full number. */
    public function masked(string $field): string
    {
        $v = (string) $this->{$field};

        return strlen($v) > 4 ? str_repeat('•', 4).' '.substr($v, -4) : $v;
    }

    protected static function booted(): void
    {
        // Reference needs the id, so write a placeholder first and swap it after insert.
        static::creating(fn (self $app) => $app->reference ??= 'tmp-'.uniqid());
        static::created(fn (self $app) => $app->updateQuietly(['reference' => 'APP-'.str_pad($app->id, 6, '0', STR_PAD_LEFT)]));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class);
    }

    public function loan(): HasOne
    {
        return $this->hasOne(Loan::class);
    }

    /** Shared by the admin list and the CSV export so both always agree. */
    public function scopeFilter(Builder $query, array $f): void
    {
        $query
            ->when($f['search'] ?? null, fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('reference', 'like', "%{$s}%")
                ->orWhere('national_id', 'like', "%{$s}%")
                ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"))))
            ->when($f['country'] ?? null, fn ($q, $c) => $q->where('country', $c))
            ->when($f['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($f['from'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($f['to'] ?? null, fn ($q, $d) => $q->whereDate('created_at', '<=', $d));
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['pending', 'under_review'], true);
    }
}
