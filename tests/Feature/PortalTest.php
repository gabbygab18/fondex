<?php

namespace Tests\Feature;

use App\Models\CountrySetting;
use App\Models\User;
use App\Notifications\ContactInquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_login_and_role_redirects(): void
    {
        $this->post('/register', [
            'name' => 'Ana', 'email' => 'ana@example.com', 'phone' => '300', 'country' => 'CO',
            'password' => 'secret-pass-1', 'password_confirmation' => 'secret-pass-1',
        ])->assertRedirect('/account');
        $this->post('/logout');

        $this->post('/login', ['email' => 'ana@example.com', 'password' => 'wrong'])->assertSessionHasErrors('email');
        User::where('email', 'ana@example.com')->update(['is_active' => false]);
        $this->post('/login', ['email' => 'ana@example.com', 'password' => 'secret-pass-1'])->assertSessionHasErrors('email');

        $staff = User::factory()->create(['role' => 'staff', 'password' => 'secret-pass-1']);
        $this->post('/login', ['email' => $staff->email, 'password' => 'secret-pass-1'])->assertRedirect('/admin');
        // Staff can't reach admin-only pages.
        $this->get('/admin/settings')->assertForbidden();
    }

    public function test_staff_add_existing_client_and_invite_them(): void
    {
        Notification::fake();
        CountrySetting::create(['code' => 'AR', 'name' => 'Argentina', 'currency' => 'ARS', 'min_amount' => 50000, 'max_amount' => 3000000, 'min_term' => 1, 'max_term' => 3]);
        $staff = User::factory()->create(['role' => 'staff']);
        $data = ['name' => 'Lucía Gómez', 'email' => 'lucia@example.com', 'phone' => '+54 11 5555', 'country' => 'AR', 'address' => 'Av. Corrientes 1234', 'invite' => true,
            'city' => 'Buenos Aires', 'employment_status' => 'employed', 'monthly_income' => '900000', 'id_type' => 'national_id', 'id_number' => '30111222', 'occupation' => ''];

        // Address is required for clients added by hand; the rest is optional.
        $this->actingAs($staff)->post('/admin/clients', ['address' => ''] + $data)->assertSessionHasErrors('address');

        $this->actingAs($staff)->post('/admin/clients', $data)->assertSessionHasNoErrors();
        $client = User::firstWhere('email', 'lucia@example.com');
        $this->assertSame(['borrower', 'AR'], [$client->role, $client->country]);
        Notification::assertSentTo($client, \Illuminate\Auth\Notifications\ResetPassword::class);
        // Extra details are kept (empty ones dropped), encrypted at rest, and shown on the client page.
        $this->assertSame(['address' => 'Av. Corrientes 1234', 'city' => 'Buenos Aires', 'employment_status' => 'employed', 'monthly_income' => '900000', 'id_type' => 'national_id', 'id_number' => '30111222'], $client->profile);
        $this->assertStringNotContainsString('30111222', \DB::table('users')->where('id', $client->id)->value('profile'));
        $this->actingAs($staff)->get("/admin/clients/{$client->id}")->assertInertia(fn ($page) => $page
            ->where('profile.id_number', '30111222')->where('profile.currency', 'ARS')->where('profile.reference', null));
        $this->actingAs($staff)->post('/admin/clients', $data)->assertSessionHasErrors('email');
        $this->actingAs($client)->post('/admin/clients', ['email' => 'x@example.com'] + $data)->assertForbidden();
    }

    public function test_admin_settings_users_and_export(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $co = CountrySetting::create(['code' => 'CO', 'name' => 'Colombia', 'currency' => 'COP', 'min_amount' => 500000, 'max_amount' => 50000000, 'min_term' => 1, 'max_term' => 3]);

        $this->actingAs($admin)->put("/admin/settings/{$co->id}", ['min_amount' => 100, 'max_amount' => 50, 'starting_limit' => 50, 'limit_increase_pct' => 50, 'min_term' => 1, 'max_term' => 3, 'is_active' => true])
            ->assertSessionHasErrors('max_amount');
        $this->actingAs($admin)->put("/admin/settings/{$co->id}", ['min_amount' => 100, 'max_amount' => 5000, 'starting_limit' => 2500, 'limit_increase_pct' => 50, 'min_term' => 1, 'max_term' => 3, 'is_active' => false])
            ->assertSessionHasNoErrors();
        $this->assertFalse($co->fresh()->is_active);

        $this->actingAs($admin)->post('/admin/users', ['name' => 'Op', 'email' => 'op@example.com', 'role' => 'staff', 'password' => 'secret-pass-1'])->assertSessionHasNoErrors();
        $this->actingAs($admin)->patch("/admin/users/{$admin->id}", ['role' => 'staff', 'is_active' => true])->assertSessionHas('error');
        $this->assertSame('admin', $admin->fresh()->role);

        $csv = $this->actingAs($admin)->get('/admin/reports/export?type=applications')->assertOk()->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBFReference,", $csv);
        $this->actingAs($admin)->get('/admin/reports/export?type=nope')->assertSessionHasErrors('type');
    }

    public function test_contact_form_and_locale(): void
    {
        Notification::fake();
        $this->post('/contact', ['name' => 'Luis', 'email' => 'luis@example.com', 'message' => 'Hola'])->assertSessionHas('success');
        Notification::assertSentOnDemand(ContactInquiry::class);

        $this->post('/locale/en')->assertRedirect();
        $this->assertSame('en', session('locale'));
        $this->post('/locale/fr')->assertNotFound();
    }
}
