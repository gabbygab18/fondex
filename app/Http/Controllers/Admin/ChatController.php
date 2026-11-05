<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Chat;
use Illuminate\Http\Request;
use Inertia\Inertia;

/** Staff inbox for live chat. The page polls, so new chats and messages show up without a refresh. */
class ChatController extends Controller
{
    public function index(Request $request)
    {
        $open = $request->integer('chat') ? Chat::find($request->integer('chat')) : null;
        $open?->update(['staff_read_at' => now()]);
        $unread = Chat::unread()->pluck('id')->flip();

        return Inertia::render('Admin/Chats', [
            'chats' => Chat::with(['messages' => fn ($m) => $m->latest('id')->limit(1)])
                ->whereNotNull('last_message_at')->latest('last_message_at')->limit(100)->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'email' => $c->email,
                    'user_id' => $c->user_id,
                    'last' => $c->messages->first()?->body,
                    'at' => $c->last_message_at,
                    'unread' => $unread->has($c->id),
                ]),
            'open' => $open ? [
                'id' => $open->id,
                'name' => $open->name,
                'email' => $open->email,
                'user_id' => $open->user_id,
                'messages' => $open->messages()->orderBy('id')->get(['id', 'kind', 'body', 'created_at'])->each(function ($m) { // no arrow fn: each() stops at the first false
                    if ($m->kind === 'bot') $m->body = __($m->body);
                }),
            ] : null,
        ]);
    }

    public function reply(Request $request, Chat $chat)
    {
        $data = $request->validate(['body' => ['required', 'string', 'max:2000']]);
        $staff = $request->user();
        // First staff reply: the visitor leaves the queue and sees "<name> joined the chat"; the bot stops answering.
        if (! $chat->messages()->where('kind', 'system')->exists()) {
            $chat->messages()->create(['kind' => 'system', 'body' => strtok($staff->name, ' '), 'staff_id' => $staff->id]);
        }
        $chat->messages()->create(['kind' => 'staff', 'body' => $data['body'], 'staff_id' => $staff->id]);
        $chat->update(['last_message_at' => now(), 'staff_read_at' => now()]);

        return back();
    }
}
