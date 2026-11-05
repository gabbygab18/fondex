<?php

namespace App\Http\Middleware;

use App\Models\Chat;
use App\Models\CountrySetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'app' => [
                'name' => config('app.name'),
                'whatsapp' => config('loan.whatsapp'),
                'phone' => config('loan.phone'),
                'email' => config('loan.admin_email'),
            ],
            'locale' => app()->getLocale(),
            'auth' => [
                'user' => $user?->only('id', 'name', 'email', 'role', 'country'),
                // Borrowers with an unpaid loan don't see the "apply" links.
                'can_apply' => fn () => ! $user?->hasOngoingLoan(),
                // Badge on the staff "Chats" menu item.
                'unread_chats' => fn () => $user?->isStaff() ? Chat::unread()->count() : 0,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'countries' => fn () => CountrySetting::where('is_active', true)->orderBy('code')->get(),
        ];
    }
}
