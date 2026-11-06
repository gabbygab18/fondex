<?php

namespace App\Support;

use App\Models\CountrySetting;

/**
 * Search, social and AI-answer metadata, rendered on the server in app.blade.php (crawlers and link
 * previews don't run JavaScript). Strings are English keys translated per request, like the rest of the site.
 */
class Seo
{
    /** Public pages that may be indexed: Inertia component => [title, description]. Everything else is noindex. */
    private const PAGES = [
        'Home' => ['Fast, simple personal loans', 'Short-term personal loans in Argentina and Colombia. Apply online in minutes, get an answer within 24 hours and repay in equal daily, weekly or fortnightly payments.'],
        'About' => ['About Us', 'Fondex offers fair, fast and simple personal loans in Argentina and Colombia, with clear conditions and no paperwork marathons.'],
        'Services' => ['Loans', 'Personal, emergency, education, medical, vehicle, home improvement and debt consolidation loans, in pesos, with terms you choose.'],
        'Faqs' => ['FAQs', 'Who can apply, how much you can borrow, which documents you need, how repayment works and how long a decision takes.'],
        'Contact' => ['Contact', 'Talk to the Fondex team by live chat, email or phone about applications, loans and payments.'],
        'Legal' => [null, 'How Fondex handles your personal information and the conditions of our loans.'],
    ];

    /** Shown on /faqs and published as FAQPage structured data (English keys, translated per request). */
    public const FAQS = [
        ['Who can apply for a loan?', 'Anyone 18 or older who lives in a country where we operate, has a valid national ID, a verifiable income and a bank account in their name.'],
        ['How much can I borrow?', 'It depends on your country and your income. You can see the current minimum and maximum amounts on our Loans page and try them in the calculator.'],
        ['What interest rate will I pay?', 'Your rate depends on your profile and your application. It is charged once on the amount you borrow, and we confirm your exact rate and total to repay when we approve your loan, before any money is sent.'],
        ['How long can I borrow for?', 'From 1 to 3 months. You choose to pay daily, weekly or fortnightly, in equal payments.'],
        ['How long does it take to get an answer?', 'Most applications get a decision within 24 hours on business days. We email you as soon as the status changes.'],
        ['Which documents do I need?', 'A photo or scan of your ID (front, and back if it has one) and a recent proof of income such as a payslip, bank statement or tax return.'],
        ['How do I repay the loan?', 'In equal daily, weekly or fortnightly payments. Pay online from your account, or by bank transfer, cash or local payment apps. We email you a reminder before each due date.'],
        ['Can I pay off my loan early?', 'Yes. You can make extra payments or pay the full balance at any time without penalties.'],
        ['What happens if I miss a payment?', 'Contact us right away. We will look for a solution with you. Late installments are marked as overdue in your account.'],
        ['Can I track my application?', 'Yes. Create an account, and you will see the status of every application, your loans and your payment schedule.'],
        ['Is my personal information safe?', 'Yes. Documents are stored privately and encrypted, only our credit team can see them, and we never sell your data. Read our Privacy Policy for details.'],
    ];

    public static function faqs(): array
    {
        return array_map(fn ($f) => array_map('__', $f), self::FAQS);
    }

    /** Everything the <head> needs for this Inertia page. */
    public static function for(array $page): array
    {
        $name = config('app.name');
        $component = $page['component'] ?? '';
        $public = self::PAGES[$component] ?? null;
        $title = match (true) {
            $component === 'Legal' => __(($page['props']['page'] ?? '') === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'),
            (bool) $public => __($public[0]),
            default => null,
        };
        $url = url()->current();
        $home = url('/');

        $graph = [
            [
                '@type' => 'FinancialService',
                '@id' => "{$home}/#organization",
                'name' => $name,
                'url' => $home,
                'logo' => url('/apple-touch-icon.png'),
                'image' => url('/images/og.jpg'),
                'description' => __(self::PAGES['Home'][1]),
                'email' => config('loan.admin_email'),
                'telephone' => config('loan.phone'),
                'areaServed' => [['@type' => 'Country', 'name' => 'Argentina'], ['@type' => 'Country', 'name' => 'Colombia']],
                'knowsLanguage' => ['es', 'en'],
            ],
            [
                '@type' => 'WebSite',
                '@id' => "{$home}/#website",
                'url' => $home,
                'name' => $name,
                'inLanguage' => app()->getLocale(),
                'publisher' => ['@id' => "{$home}/#organization"],
            ],
        ];
        if ($public && $component !== 'Home') {
            $graph[] = ['@type' => 'BreadcrumbList', 'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => $name, 'item' => $home],
                ['@type' => 'ListItem', 'position' => 2, 'name' => $title, 'item' => $url],
            ]];
        }
        if ($component === 'Faqs') {
            $graph[] = ['@type' => 'FAQPage', 'mainEntity' => array_map(fn ($f) => [
                '@type' => 'Question', 'name' => $f[0], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $f[1]],
            ], self::faqs())];
        }
        if ($component === 'Services' || $component === 'Home') {
            // The loan offer per country, from the live settings (amounts and terms; the rate is decided per profile).
            foreach (CountrySetting::where('is_active', true)->get() as $c) {
                $graph[] = [
                    '@type' => 'LoanOrCredit',
                    'name' => __('Personal loans').' · '.$c->name,
                    'provider' => ['@id' => "{$home}/#organization"],
                    'areaServed' => ['@type' => 'Country', 'name' => $c->name],
                    'currency' => $c->currency,
                    'amount' => ['@type' => 'MonetaryAmount', 'currency' => $c->currency, 'minValue' => (float) $c->min_amount, 'maxValue' => (float) $c->max_amount],
                    'loanTerm' => ['@type' => 'QuantitativeValue', 'minValue' => $c->min_term, 'maxValue' => $c->max_term, 'unitCode' => 'MON'],
                    'url' => url('/loans'),
                ];
            }
        }

        return [
            'title' => $title ? "{$title} · {$name}" : $name,
            'description' => __($public[1] ?? self::PAGES['Home'][1]),
            'index' => (bool) $public,
            'url' => $url,
            'image' => url('/images/og.jpg'),
            'locale' => app()->getLocale() === 'es' ? 'es_AR' : 'en_US',
            'schema' => ['@context' => 'https://schema.org', '@graph' => $graph],
        ];
    }
}
