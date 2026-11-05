<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationDocument extends Model
{
    public const TYPES = ['id_front', 'id_back', 'address_proof', 'income_proof', 'other'];

    protected $guarded = ['id'];

    protected $hidden = ['path'];

    public function application(): BelongsTo
    {
        return $this->belongsTo(LoanApplication::class, 'loan_application_id');
    }
}
