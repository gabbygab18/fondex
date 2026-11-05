<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashEntry extends Model
{
    public const CATEGORIES = ['in' => ['capital', 'other_income'], 'out' => ['expense', 'salary', 'rent', 'tax', 'withdrawal', 'other_expense']];

    protected $fillable = ['date', 'currency', 'direction', 'category', 'description', 'amount', 'recorded_by'];

    protected function casts(): array
    {
        return ['date' => 'date:Y-m-d', 'amount' => 'float'];
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
