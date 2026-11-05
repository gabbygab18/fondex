<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContactInquiry extends Notification
{
    public function __construct(public array $data) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $d = $this->data;

        return (new MailMessage)
            ->subject('New inquiry from '.$d['name'])
            ->replyTo($d['email'], $d['name'])
            ->line("Name: {$d['name']}")
            ->line("Email: {$d['email']}")
            ->line('Phone: '.($d['phone'] ?: '—'))
            ->line('Country: '.($d['country'] ?: '—'))
            ->line('Loan amount: '.($d['amount'] ?: '—'))
            ->line('Message:')
            ->line($d['message']);
    }
}
