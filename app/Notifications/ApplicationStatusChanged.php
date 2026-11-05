<?php

namespace App\Notifications;

use App\Models\LoanApplication;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationStatusChanged extends Notification
{
    public function __construct(public LoanApplication $application) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a = $this->application;
        $mail = (new MailMessage)
            ->subject(__('Update on your application :ref', ['ref' => $a->reference]))
            ->greeting(__('Hello :name,', ['name' => $notifiable->name]));

        $mail = match ($a->status) {
            'approved' => $mail->line(__('Good news: your loan application has been approved.'))
                ->line(__('Your repayment schedule is now available in your account.')),
            'rejected' => $mail->line(__('After careful review, we are unable to approve your application at this time.')),
            default => $mail->line(__('Your application is now under review.')),
        };

        if ($a->admin_notes) {
            $mail->line(__('Note from our team: :note', ['note' => $a->admin_notes]));
        }

        return $mail->action(__('View your account'), url('/account'));
    }
}
