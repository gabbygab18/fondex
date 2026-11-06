<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReferralTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_friend_who_signs_up_through_an_invite_link_is_credited(): void
    {
        $ana = User::factory()->create(['name' => 'Ana', 'role' => 'borrower', 'country' => 'AR']);
        $url = $ana->inviteUrl();
        $code = $ana->fresh()->referral_code;
        $this->assertSame(url('/?ref='.$code), $url);
        $this->assertSame($url, $ana->fresh()->inviteUrl()); // stable once made

        // The client sees their link on their dashboard.
        $this->actingAs($ana)->get('/account')->assertInertia(fn ($page) => $page->where('invite.url', $url)->where('invite.joined', 0));
        auth()->logout();

        // Visiting the link remembers the code; signing up later credits Ana.
        $this->get('/?ref='.$code)->assertCookie('ref', $code);
        $this->withCookie('ref', $code)->post('/register', [
            'name' => 'Luis Paz', 'email' => 'luis@example.com', 'phone' => '+54 11 4444', 'country' => 'AR',
            'password' => 'Secret-pass-123', 'password_confirmation' => 'Secret-pass-123',
        ])->assertRedirect('/account');
        $luis = User::firstWhere('email', 'luis@example.com');
        $this->assertSame($ana->id, $luis->referred_by);

        $staff = User::factory()->create(['role' => 'staff']);
        $this->actingAs($staff)->get("/admin/clients/{$ana->id}")->assertInertia(fn ($page) => $page->where('referrals.0.name', 'Luis Paz'));
        $this->actingAs($staff)->get("/admin/clients/{$luis->id}")->assertInertia(fn ($page) => $page->where('referrer.name', 'Ana'));
    }
}
