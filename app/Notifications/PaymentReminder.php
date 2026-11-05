<?php

namespace App\Notifications;

use App\Models\Installment;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReminder extends Notification
{
    /** @param 'upcoming'|'due_today'|'overdue' $kind */
    public function __construct(public Installment $installment, public string $kind) {}

    public function via(object $notifiable): array
    {
        return ['mail', SmsChannel::class];
    }

    /** Short text version; kept under 160 characters so it's one SMS. */
    public function toSms(object $notifiable): string
    {
        $i = $this->installment;
        $loan = $i->loan;
        $amount = $loan->currency.' '.number_format($i->amount_due - $i->amount_paid, 0, ',', '.');
        $app = config('app.name');

        return match ($this->kind) {
            'upcoming' => __(':app: your payment of :amount for :ref is due :date.', ['app' => $app, 'amount' => $amount, 'ref' => $loan->reference, 'date' => $i->due_date->format('d/m')]),
            'due_today' => __(':app: your payment of :amount for :ref is due today.', ['app' => $app, 'amount' => $amount, 'ref' => $loan->reference]),
            default => __(':app: your payment of :amount for :ref is overdue. Please pay as soon as possible.', ['app' => $app, 'amount' => $amount, 'ref' => $loan->reference]),
        }.' '.url("/account/loans/{$loan->id}");
    }

    public function toMail(object $notifiable): MailMessage
    {
        $i = $this->installment;
        $loan = $i->loan;
        $amount = $loan->currency.' '.number_format($i->amount_due - $i->amount_paid, 2);
        $date = $i->due_date->toDateString();

        $mail = (new MailMessage)->greeting(__('Hello :name,', ['name' => $notifiable->name]));

        $mail = match ($this->kind) {
            'upcoming' => $mail->subject(__('Payment due soon for :ref', ['ref' => $loan->reference]))
                ->line(__('Your installment of :amount is due on :date.', ['amount' => $amount, 'date' => $date])),
            'due_today' => $mail->subject(__('Payment due today for :ref', ['ref' => $loan->reference]))
                ->line(__('Your installment of :amount is due today.', ['amount' => $amount])),
            default => $mail->subject(__('Overdue payment on :ref', ['ref' => $loan->reference]))
                ->line(__('Your installment of :amount was due on :date and is still unpaid.', ['amount' => $amount, 'date' => $date]))
                ->line(__('Please pay as soon as possible, or reply to this email if you need help.')),
        };

        return $mail->action(__('Pay now'), url("/account/loans/{$loan->id}"));
    }
}
