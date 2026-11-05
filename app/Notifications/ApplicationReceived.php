<?php

namespace App\Notifications;

use App\Models\LoanApplication;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Sent to the applicant, and (with $forAdmin) to the business inbox, when an application is submitted. */
class ApplicationReceived extends Notification
{
    public function __construct(public LoanApplication $application, public bool $forAdmin = false) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $a = $this->application;
        $amount = $a->currency.' '.number_format($a->amount, 2);

        if ($this->forAdmin) {
            return (new MailMessage)
                ->subject("New loan application {$a->reference}")
                ->line("{$a->user->name} ({$a->user->email}) applied for {$amount} over {$a->term_months} months.")
                ->line("Country: {$a->country} · Purpose: {$a->purpose}")
                ->action('Review application', url("/admin/applications/{$a->id}"));
        }

        return (new MailMessage)
            ->subject(__('We received your application :ref', ['ref' => $a->reference]))
            ->greeting(__('Hello :name,', ['name' => $a->user->name]))
            ->line(__('Thanks for applying for :amount over :months months.', ['amount' => $amount, 'months' => $a->term_months]))
            ->line(__('Our team will review it and email you as soon as there is a decision.'))
            ->action(__('Track your application'), url("/account/applications/{$a->id}"));
    }
}
