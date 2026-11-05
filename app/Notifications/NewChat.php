<?php

namespace App\Notifications;

use App\Models\Chat;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewChat extends Notification
{
    public function __construct(public Chat $chat, public string $first) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New chat from '.$this->chat->name)
            ->line('Email: '.($this->chat->email ?: '—'))
            ->line('Message:')
            ->line($this->first)
            ->action('Reply in the admin portal', url('/admin/chats?chat='.$this->chat->id));
    }
}
