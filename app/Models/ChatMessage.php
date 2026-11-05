<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['chat_id', 'kind', 'staff_id', 'body', 'topic'];
}
