<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CountrySetting extends Model
{
    protected $fillable = ['code', 'name', 'currency', 'min_amount', 'max_amount', 'starting_limit', 'limit_increase_pct', 'min_term', 'max_term', 'is_active'];

    protected function casts(): array
    {
        return [
            'min_amount' => 'float',
            'max_amount' => 'float',
            'starting_limit' => 'float',
            'limit_increase_pct' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
