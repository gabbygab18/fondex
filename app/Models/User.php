<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Translation\HasLocalePreference;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements HasLocalePreference
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLES = ['borrower', 'staff', 'admin'];

    protected $fillable = ['name', 'email', 'password', 'phone', 'country', 'profile', 'referred_by', 'locale', 'role', 'is_active'];

    protected $hidden = ['password', 'remember_token', 'profile'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            // Client details entered by staff (same keys as an application), encrypted with APP_KEY.
            'profile' => 'encrypted:array',
        ];
    }

    public function isStaff(): bool
    {
        return in_array($this->role, ['staff', 'admin'], true);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function preferredLocale(): string
    {
        return $this->locale ?? 'es';
    }

    /** Phone in E.164 form (+ and digits) for SMS; null if there's no usable number. */
    public function routeNotificationForSms(): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $this->phone);

        return strlen($digits) >= 8 ? '+'.$digits : null;
    }

    /** Who invited this client ("Invite friends"), and the clients they invited. */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_by');
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(User::class, 'referred_by');
    }

    /** This client's invite link, created the first time they open it. */
    public function inviteUrl(): string
    {
        if (! $this->referral_code) {
            do {
                $code = strtolower(\Illuminate\Support\Str::random(8));
            } while (self::where('referral_code', $code)->exists());
            $this->forceFill(['referral_code' => $code])->save();
        }

        return url('/?ref='.$this->referral_code);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(LoanApplication::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /** A loan not yet fully paid: the client can't apply for another until it is. */
    public function hasOngoingLoan(): bool
    {
        return $this->loans()->where('status', '!=', 'paid')->exists();
    }
}
