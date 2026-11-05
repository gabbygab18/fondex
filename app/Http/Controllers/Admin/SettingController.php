<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CountrySetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Settings', ['settings' => CountrySetting::orderBy('code')->get()]);
    }

    public function update(Request $request, CountrySetting $setting)
    {
        $data = $request->validate([
            'min_amount' => ['required', 'numeric', 'min:1'],
            'max_amount' => ['required', 'numeric', 'gt:min_amount'],
            // Client limits: where new clients start, and how much a good payer's limit grows after each paid-off loan.
            'starting_limit' => ['required', 'numeric', 'gte:min_amount', 'lte:max_amount'],
            'limit_increase_pct' => ['required', 'integer', 'min:0', 'max:500'],
            // Terms are 1 to 3 months; rates are chosen per loan at approval.
            'min_term' => ['required', 'integer', 'min:1', 'max:12'],
            'max_term' => ['required', 'integer', 'gte:min_term', 'max:12'],
            'is_active' => ['required', 'boolean'],
        ]);

        $setting->update($data);

        return back()->with('success', "{$setting->name} settings saved.");
    }
}
