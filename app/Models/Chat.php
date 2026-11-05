<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chat extends Model
{
    protected $fillable = ['user_id', 'name', 'email', 'last_message_at', 'staff_read_at'];

    protected function casts(): array
    {
        return ['last_message_at' => 'datetime', 'staff_read_at' => 'datetime'];
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Chats with visitor messages staff haven't opened yet. */
    public function scopeUnread(Builder $q): void
    {
        $q->whereHas('messages', fn ($m) => $m->where('kind', 'visitor')->where(fn ($w) => $w
            ->whereColumn('chat_messages.created_at', '>', 'chats.staff_read_at')
            ->orWhereNull('chats.staff_read_at')));
    }
}
