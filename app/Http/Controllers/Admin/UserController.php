<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only('search', 'role');

        return Inertia::render('Admin/Users', [
            'filters' => $filters,
            'users' => User::query()
                ->when($filters['search'] ?? null, fn ($q, $s) => $q->where(fn ($q) => $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")))
                ->when($filters['role'] ?? null, fn ($q, $r) => $q->where('role', $r))
                ->withCount('applications')
                ->orderByRaw("FIELD(role, 'admin', 'staff', 'borrower')")->latest()
                ->paginate(20)->withQueryString(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users'],
            'role' => ['required', Rule::in(['staff', 'admin'])],
            'password' => ['required', Password::defaults()],
        ]);

        User::create($data);

        return back()->with('success', 'Team member added.');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(User::ROLES)],
            'is_active' => ['required', 'boolean'],
        ]);

        if ($user->is($request->user()) && ($data['role'] !== 'admin' || ! $data['is_active'])) {
            return back()->with('error', 'You cannot demote or deactivate yourself.');
        }

        $user->update($data);

        return back()->with('success', 'User updated.');
    }
}
