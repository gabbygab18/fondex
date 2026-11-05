<?php

namespace App\Http\Controllers;

use App\Notifications\ContactInquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:40'],
            'country' => ['nullable', 'in:AR,CO'],
            'amount' => ['nullable', 'string', 'max:40'],
            'message' => ['required', 'string', 'max:3000'],
        ]);

        Notification::route('mail', config('loan.admin_email'))->notify(new ContactInquiry($data));

        return back()->with('success', __('Thanks! We received your message and will reply within one business day.'));
    }
}
