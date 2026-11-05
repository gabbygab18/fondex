<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    public const METHODS = ['cash', 'bank_transfer', 'mercado_pago', 'pse', 'wompi', 'online', 'other'];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['amount' => 'float', 'paid_on' => 'date:Y-m-d'];
    }

    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
