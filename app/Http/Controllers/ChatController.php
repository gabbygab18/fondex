<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Notifications\NewChat;
use App\Support\ChatBot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

/**
 * The visitor side of live chat: JSON for the chat bubble, which polls for staff replies.
 * Until a staff member answers, the keyword bot (App\Support\ChatBot) replies to each message.
 */
class ChatController extends Controller
{
    /** Messages after ?after=<id> in this visitor's chat, plus queue status. */
    public function index(Request $request)
    {
        $chat = $this->current($request);

        return $this->payload($chat, $request->integer('after'));
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $chat = $this->current($request);
        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
            'name' => [$chat || $user ? 'nullable' : 'required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:190'],
        ]);

        if (! $chat) {
            $chat = Chat::create([
                'user_id' => $user?->id,
                'name' => $user->name ?? $data['name'],
                'email' => $user->email ?? $data['email'] ?? null,
            ]);
            $request->session()->put('chat_id', $chat->id);
            Notification::route('mail', config('loan.admin_email'))->notify(new NewChat($chat, $data['body']));
        }

        $chat->messages()->create(['body' => $data['body']]);
        if (! $this->agent($chat)) {
            $topic = ChatBot::topic($data['body']);
            $chat->messages()->create(['kind' => 'bot', 'topic' => $topic, 'body' => ChatBot::answer($topic, $this->history($chat))]);
        }
        $chat->update(['last_message_at' => now()]);

        return $this->payload($chat, $request->integer('after'));
    }

    // ponytail: a guest's chat lives in their session (2h idle by default); signed-in users get theirs back on any device.
    private function current(Request $request): ?Chat
    {
        $id = $request->session()->get('chat_id');

        return ($id ? Chat::find($id) : null)
            ?? ($request->user() ? Chat::where('user_id', $request->user()->id)->latest('last_message_at')->first() : null);
    }

    /** Name of the staff member who joined, or null while the visitor is still queued. */
    private function agent(Chat $chat): ?string
    {
        return $chat->messages()->where('kind', 'system')->latest('id')->value('body');
    }

    /** Topics the bot already answered in this chat, oldest first (null = it didn't understand). */
    private function history(Chat $chat): array
    {
        return $chat->messages()->where('kind', 'bot')->orderBy('id')->pluck('topic')->all();
    }

    private function payload(?Chat $chat, int $after): array
    {
        if (! $chat) {
            return ['started' => false, 'messages' => [], 'agent' => null, 'queue' => null, 'suggest' => array_map('__', ChatBot::suggest(null, []))];
        }
        $agent = $this->agent($chat);
        $history = $this->history($chat);

        return [
            'started' => true,
            // Follow-up questions for the chips, based on the last answer; none once staff joined.
            'suggest' => $agent ? [] : array_map('__', ChatBot::suggest(end($history) ?: null, $history)),
            // Bot answers are stored as English keys and shown in the visitor's current language.
            'messages' => $chat->messages()->where('id', '>', $after)->orderBy('id')->get(['id', 'kind', 'body', 'created_at as at'])
                ->each(function ($m) { // no arrow fn: each() stops at the first false
                    if ($m->kind === 'bot') $m->body = __($m->body);
                }),
            'agent' => $agent,
            // Place in line among chats active in the last 2 hours that no staff member has joined yet.
            'queue' => $agent ? null : Chat::where('id', '<=', $chat->id)
                ->where('last_message_at', '>', now()->subHours(2))
                ->whereDoesntHave('messages', fn ($m) => $m->where('kind', 'system'))
                ->count(),
        ];
    }
}
