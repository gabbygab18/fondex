<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

/** Remembers an invite link's ?ref= code for 30 days, so the friend is credited when they sign up. */
class CaptureReferral
{
    public function handle(Request $request, Closure $next): Response
    {
        $ref = $request->query('ref');
        if (is_string($ref) && preg_match('/^[a-z0-9]{6,12}$/', $ref)) {
            Cookie::queue('ref', $ref, 60 * 24 * 30);
        }

        return $next($request);
    }
}
