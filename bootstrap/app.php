<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Behind Cloudflare Tunnel (or any HTTPS proxy): honor X-Forwarded-Proto/Host so URLs come out as https.
        $middleware->trustProxies(at: '*');
        $middleware->web(append: [SetLocale::class, \App\Http\Middleware\CaptureReferral::class, HandleInertiaRequests::class]);
        $middleware->alias(['role' => EnsureRole::class]);
        $middleware->redirectUsersTo(fn ($request) => $request->user()->isStaff() ? '/admin' : '/account');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
