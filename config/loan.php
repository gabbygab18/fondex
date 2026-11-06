<?php

return [
    'admin_email' => env('LOAN_ADMIN_EMAIL', 'admin@example.com'),
    'whatsapp' => env('LOAN_WHATSAPP'),
    'phone' => env('LOAN_PHONE'),

    // Flat rates (% of principal) the admin chooses from when approving a loan.
    'rates' => [20, 25, 30, 35],

    // Online payments: "off" (no "Pay now"; staff record payments), "sandbox" (built-in test checkout, no real
    // money: never on the live site, borrowers could mark loans paid) or "stripe".
    'gateway' => env('PAYMENT_GATEWAY', 'off'),
    // Reminder texts: "log" writes them to storage/logs until an SMS account exists, "twilio" sends them.
    'sms' => [
        'driver' => env('SMS_DRIVER', 'log'),
        'twilio_sid' => env('TWILIO_SID'),
        'twilio_token' => env('TWILIO_TOKEN'),
        'twilio_from' => env('TWILIO_FROM'),
    ],
    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],
];
