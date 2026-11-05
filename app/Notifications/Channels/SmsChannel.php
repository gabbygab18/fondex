<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Text messages for notifications that define toSms(). SMS_DRIVER=log (default) only writes them to the
 * log; SMS_DRIVER=twilio sends them through Twilio's API once the client has an account.
 */
class SmsChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        $to = $notifiable->routeNotificationFor('sms', $notification);
        if (! $to || ! method_exists($notification, 'toSms')) {
            return;
        }
        $body = $notification->toSms($notifiable);

        if (config('loan.sms.driver') !== 'twilio') {
            Log::info("SMS to {$to}: {$body}");

            return;
        }

        $sid = config('loan.sms.twilio_sid');
        Http::withBasicAuth($sid, config('loan.sms.twilio_token'))
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'From' => config('loan.sms.twilio_from'),
                'To' => $to,
                'Body' => $body,
            ])
            ->throw();
    }
}
