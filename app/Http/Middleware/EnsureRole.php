<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Usage: role:staff (staff or admin) or role:admin (admin only). */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        abort_unless($user && ($role === 'admin' ? $user->isAdmin() : $user->isStaff()), 403);

        return $next($request);
    }
}
