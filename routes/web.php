<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Admin;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\PaymentController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use App\Http\Middleware\SetLocale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public site
Route::inertia('/', 'Home');
Route::inertia('/about', 'About');
Route::inertia('/loans', 'Services');
Route::get('/faqs', fn () => \Inertia\Inertia::render('Faqs', ['faqs' => \App\Support\Seo::faqs()]));
// For AI answer engines (llmstxt.org): what Fondex offers, from the live settings, in plain Markdown.
Route::get('/llms.txt', fn () => response()->view('llms', [
    'countries' => \App\Models\CountrySetting::where('is_active', true)->get(),
    'faqs' => \App\Support\Seo::FAQS,
])->header('Content-Type', 'text/plain; charset=utf-8'));
Route::inertia('/contact', 'Contact');
Route::inertia('/privacy', 'Legal', ['page' => 'privacy']);
Route::inertia('/terms', 'Legal', ['page' => 'terms']);
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:5,1');
Route::get('/chat', [ChatController::class, 'index'])->middleware('throttle:60,1');
Route::post('/chat', [ChatController::class, 'store'])->middleware('throttle:20,1');

Route::post('/locale/{locale}', function (Request $request, string $locale) {
    abort_unless(in_array($locale, SetLocale::LOCALES, true), 404);
    $request->session()->put('locale', $locale);
    $request->user()?->update(['locale' => $locale]);

    return back();
});

// Auth
Route::middleware('guest')->group(function () {
    Route::inertia('/login', 'Auth/Login')->name('login');
    Route::inertia('/register', 'Auth/Register');
    Route::inertia('/forgot-password', 'Auth/ForgotPassword');
    Route::get('/reset-password/{token}', [AuthController::class, 'showReset'])->name('password.reset');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
    Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->middleware('throttle:3,1');
    Route::post('/reset-password', [AuthController::class, 'reset']);
});
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');

// Borrower area
Route::middleware('auth')->group(function () {
    Route::get('/apply', [ApplicationController::class, 'create']);
    Route::post('/apply', [ApplicationController::class, 'store'])->middleware('throttle:5,1');
    Route::get('/account', [AccountController::class, 'dashboard']);
    Route::get('/account/applications/{application}', [ApplicationController::class, 'show']);
    Route::get('/account/loans/{loan}', [AccountController::class, 'loan']);
    Route::get('/documents/{document}', [ApplicationController::class, 'document']);
    Route::post('/account/loans/{loan}/pay', [PaymentController::class, 'start'])->middleware('throttle:10,1');
    Route::get('/pay/sandbox/{loan}', [PaymentController::class, 'sandbox'])->middleware('signed')->name('pay.sandbox');
    Route::post('/pay/sandbox/{loan}', [PaymentController::class, 'sandboxConfirm'])->middleware('signed');
});

// Stripe calls this server-to-server; it's authenticated by the Stripe-Signature header, not a session.
Route::post('/webhooks/stripe', [PaymentController::class, 'stripeWebhook'])->withoutMiddleware([ValidateCsrfToken::class]);

// Admin portal: staff and admins; settings and team management are admin-only.
Route::middleware(['auth', 'role:staff'])->prefix('admin')->group(function () {
    Route::get('/', Admin\DashboardController::class);
    Route::get('/applications', [Admin\ApplicationController::class, 'index']);
    Route::get('/applications/{application}', [Admin\ApplicationController::class, 'show']);
    Route::patch('/applications/{application}', [Admin\ApplicationController::class, 'update']);
    Route::get('/clients', [Admin\ClientController::class, 'index']);
    Route::post('/clients', [Admin\ClientController::class, 'store']);
    Route::get('/clients/{user}', [Admin\ClientController::class, 'show']);
    Route::post('/clients/{user}/loans', [Admin\LoanController::class, 'store']);
    Route::get('/loans', [Admin\LoanController::class, 'index']);
    Route::post('/loans/{loan}/remind', [Admin\LoanController::class, 'remind'])->middleware('throttle:20,1');
    Route::get('/loans/{loan}', [Admin\LoanController::class, 'show']);
    Route::post('/loans/{loan}/payments', [Admin\LoanController::class, 'storePayment']);
    Route::get('/chats', [Admin\ChatController::class, 'index']);
    Route::post('/chats/{chat}', [Admin\ChatController::class, 'reply']);
    Route::get('/reports', [Admin\ReportController::class, 'index']);
    Route::get('/reports/export', [Admin\ReportController::class, 'export']);

    Route::middleware('role:admin')->group(function () {
        Route::get('/accounting', [Admin\AccountingController::class, 'index']);
        Route::get('/accounting/export', [Admin\AccountingController::class, 'export']);
        Route::post('/accounting/entries', [Admin\AccountingController::class, 'store']);
        Route::delete('/accounting/entries/{entry}', [Admin\AccountingController::class, 'destroy']);
        Route::get('/settings', [Admin\SettingController::class, 'index']);
        Route::put('/settings/{setting}', [Admin\SettingController::class, 'update']);
        Route::get('/users', [Admin\UserController::class, 'index']);
        Route::post('/users', [Admin\UserController::class, 'store']);
        Route::patch('/users/{user}', [Admin\UserController::class, 'update']);
    });
});
