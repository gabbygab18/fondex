<?php

namespace Tests\Feature;

use App\Models\CountrySetting;
use App\Models\User;
use App\Notifications\Channels\SmsChannel;
use App\Notifications\PaymentReminder;
use App\Support\CreditProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LoanFlowTest extends TestCase
{
    use RefreshDatabase;

    private function application(array $over = []): array
    {
        return [
            'country' => 'CO', 'loan_type' => 'personal', 'amount' => 1000000, 'term_months' => 1, 'repayment_frequency' => 'weekly', 'purpose' => 'Medical bill',
            'full_name' => 'Ana Ruiz', 'date_of_birth' => '1990-05-01', 'email' => 'ana@example.com', 'phone' => '300', 'address' => 'Calle 1', 'city' => 'Bogotá',
            'employment_status' => 'employed', 'employer_name' => 'Acme', 'occupation' => 'Nurse',
            'monthly_income' => 3000000, 'monthly_expenses' => 1000000,
            'id_type' => 'national_id', 'id_number' => '1020304050', 'id_issuing_country' => 'CO',
            'disbursement_method' => 'bank', 'bank_name' => 'Bancolombia', 'account_holder' => 'Ana Ruiz', 'account_type' => 'savings', 'account_number' => '0123456789',
            'consent_privacy' => '1', 'consent_data_use' => '1', 'consent_credit_check' => '1', 'declaration_accurate' => '1',
            'id_front' => UploadedFile::fake()->image('id.jpg'),
            'address_proof' => UploadedFile::fake()->create('bill.pdf', 100, 'application/pdf'),
            'income_proof' => UploadedFile::fake()->create('pay.pdf', 100, 'application/pdf'),
            ...$over,
        ];
    }

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        Storage::fake('local');
        CountrySetting::create(['code' => 'CO', 'name' => 'Colombia', 'currency' => 'COP', 'min_amount' => 200000, 'max_amount' => 10000000, 'min_term' => 1, 'max_term' => 3]);
    }

    public function test_good_payers_get_a_higher_limit(): void
    {
        CountrySetting::where('code', 'CO')->update(['starting_limit' => 1000000, 'limit_increase_pct' => 50]);
        $borrower = User::factory()->create(['country' => 'CO']);
        $admin = User::factory()->create(['role' => 'admin']);
        $credit = fn () => CreditProfile::for($borrower->fresh())->summary(CountrySetting::firstWhere('code', 'CO'));

        // New client: no score yet, and capped at the starting limit.
        $this->assertSame(['new', 1000000.0], [$credit()['label'], $credit()['limit']]);
        $this->actingAs($borrower)->post('/apply', $this->application(['amount' => 1500000]))->assertSessionHasErrors('amount');

        $this->actingAs($borrower)->post('/apply', $this->application())->assertSessionHasNoErrors();
        $app = $borrower->applications()->first();
        $this->actingAs($admin)->patch("/admin/applications/{$app->id}", ['status' => 'approved', 'interest_rate' => 20]);
        $loan = $app->fresh()->loan;

        // Paid off on time: score 100, limit up 50% on that loan, and the next application may use it.
        $this->actingAs($admin)->post("/admin/loans/{$loan->id}/payments", ['amount' => $loan->outstanding(), 'paid_on' => today()->toDateString(), 'method' => 'cash']);
        $this->assertSame([100, 'excellent', 1500000.0], [$credit()['score'], $credit()['label'], $credit()['limit']]);
        $this->actingAs($borrower)->post('/apply', $this->application(['amount' => 1500000]))->assertSessionHasNoErrors();
    }

    public function test_accounting_splits_interest_and_takes_cash_entries(): void
    {
        $borrower = User::factory()->create(['country' => 'CO']);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($borrower)->post('/apply', $this->application())->assertSessionHasNoErrors();
        $app = $borrower->applications()->first();
        $this->actingAs($admin)->patch("/admin/applications/{$app->id}", ['status' => 'approved', 'interest_rate' => 20]);
        $loan = $app->fresh()->loan;

        // 1,000,000 at 20% repays 1,200,000: a 120,000 payment is 100,000 principal + 20,000 interest.
        $this->actingAs($admin)->post("/admin/loans/{$loan->id}/payments", ['amount' => 120000, 'paid_on' => today()->toDateString(), 'method' => 'cash']);
        $entry = ['date' => today()->toDateString(), 'currency' => 'COP', 'direction' => 'out', 'category' => 'rent', 'description' => 'Office rent', 'amount' => 50000];
        $this->actingAs($admin)->post('/admin/accounting/entries', ['category' => 'capital'] + $entry)->assertSessionHasErrors('category');
        $this->actingAs($admin)->post('/admin/accounting/entries', $entry)->assertSessionHasNoErrors();
        // Capital has no upper limit and its box counts all time, outside the dates shown.
        $capital = ['direction' => 'in', 'category' => 'capital', 'amount' => 75000000, 'date' => today()->subYear()->toDateString()] + $entry;
        $this->actingAs($admin)->post('/admin/accounting/entries', $capital)->assertSessionHasNoErrors();

        $this->actingAs($admin)->get('/admin/accounting?currency=COP&period=daily')->assertInertia(fn ($page) => $page
            ->where('totals.lent', 1000000)
            ->where('totals.collected', 120000)
            ->where('totals.interest', 20000)
            ->where('totals.principal', 100000)
            ->where('totals.cash_out', 50000)
            ->where('totals.net', 120000 - 1000000 - 50000)
            ->where('outstanding.balance', 1080000)
            ->where('capital.in', 75000000)
            ->has('ledger', 3));
        $this->get('/admin/accounting/export?currency=COP')->assertOk();
        $this->actingAs(User::factory()->create(['role' => 'staff']))->get('/admin/accounting')->assertForbidden();
    }

    public function test_staff_add_an_existing_loan_with_past_payments(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $client = User::factory()->create(['country' => 'CO']);
        $loan = [
            'principal' => 1000000, 'interest_rate' => 20, 'term_months' => 1, 'repayment_frequency' => 'weekly',
            'disbursed_at' => today()->subDays(20)->toDateString(), 'already_paid' => 600000, 'paid_on' => today()->subDay()->toDateString(),
        ];

        $this->actingAs($staff)->post("/admin/clients/{$client->id}/loans", ['already_paid' => 2000000] + $loan)->assertSessionHasErrors('already_paid');
        $this->actingAs($staff)->post("/admin/clients/{$client->id}/loans", $loan)->assertSessionHasNoErrors();

        // 1,200,000 in 4 weekly payments of 300,000; 600,000 already paid covers the first two.
        $l = $client->loans()->first();
        $this->assertNull($l->loan_application_id);
        $this->assertMatchesRegularExpression('/^LN-E\d{5}$/', $l->reference);
        $this->assertSame([1200000.0, 600000.0, 'active', 'COP'], [(float) $l->total_payable, (float) $l->amount_paid, $l->status, $l->currency]);
        $this->assertSame(2, $l->installments()->whereNotNull('paid_at')->count());
        // The client sees it in their portal, with no application behind it.
        $this->actingAs($client)->get("/account/loans/{$l->id}")->assertOk();
        $this->actingAs($staff)->get("/admin/loans/{$l->id}")->assertOk();

        // Their own loan number is kept, and must be unique.
        $own = ['reference' => 'OLD-77', 'already_paid' => null, 'paid_on' => null] + $loan;
        $this->actingAs($staff)->post("/admin/clients/{$client->id}/loans", $own)->assertSessionHasNoErrors();
        $this->assertTrue($client->loans()->where('reference', 'OLD-77')->exists());
        $this->actingAs($staff)->post("/admin/clients/{$client->id}/loans", $own)->assertSessionHasErrors('reference');
    }

    public function test_cash_pickup_needs_no_bank_details(): void
    {
        $borrower = User::factory()->create(['country' => 'CO']);
        $cash = ['disbursement_method' => 'cash_pickup', 'bank_name' => '', 'account_holder' => '', 'account_type' => '', 'account_number' => 'not-a-number!'];

        // Bank details are required (and checked) only for a bank transfer...
        $this->actingAs($borrower)->post('/apply', $this->application([...$cash, 'disbursement_method' => 'bank']))
            ->assertSessionHasErrors(['bank_name', 'account_holder', 'account_number']);

        // ...and dropped for a cash pick-up, whatever was typed.
        $this->actingAs($borrower)->post('/apply', $this->application($cash))->assertSessionHasNoErrors();
        $app = $borrower->applications()->first();
        $this->assertSame('cash_pickup', $app->disbursement_method);
        $this->assertNull($app->bank_name);
        $this->assertNull($app->account_number);
    }

    public function test_apply_approve_with_rate_and_pay_online(): void
    {
        $borrower = User::factory()->create(['country' => 'CO']);
        $admin = User::factory()->create(['role' => 'admin']);

        // Terms past 3 months, under-18s and missing consents are refused.
        $this->actingAs($borrower)->post('/apply', $this->application(['term_months' => 4, 'date_of_birth' => now()->subYears(17)->toDateString(), 'declaration_accurate' => '']))
            ->assertSessionHasErrors(['term_months', 'date_of_birth', 'declaration_accurate']);

        $this->actingAs($borrower)->post('/apply', $this->application())->assertSessionHasNoErrors();
        $app = $borrower->applications()->first();
        $this->assertCount(3, $app->documents);
        // Bank and ID numbers are encrypted at rest.
        $this->assertNotSame('0123456789', $app->getRawOriginal('account_number'));
        $this->assertSame('0123456789', $app->account_number);

        $this->actingAs($borrower)->get('/admin')->assertForbidden();
        $this->actingAs(User::factory()->create())->get('/documents/'.$app->documents[0]->id)->assertNotFound();

        // Approving needs one of the allowed flat rates.
        $this->actingAs($admin)->patch("/admin/applications/{$app->id}", ['status' => 'approved', 'interest_rate' => 22])->assertSessionHasErrors('interest_rate');
        $this->actingAs($admin)->patch("/admin/applications/{$app->id}", ['status' => 'approved', 'interest_rate' => 20])->assertSessionHasNoErrors();
        $loan = $app->fresh()->loan;
        $this->assertSame(4, $loan->installment_count);

        // One loan at a time: no new application while this one is unpaid.
        $this->actingAs($borrower)->get('/apply')->assertRedirect('/account');
        $this->actingAs($borrower)->post('/apply', $this->application())->assertRedirect('/account');
        $this->assertCount(1, $borrower->applications()->get());
        // An older open application can't become a second loan either.
        $older = tap($app->replicate(['reference']), fn ($a) => $a->fill(['status' => 'pending', 'interest_rate' => null])->save());
        $this->actingAs($admin)->patch("/admin/applications/{$older->id}", ['status' => 'approved', 'interest_rate' => 20]);
        $this->assertCount(1, $borrower->loans()->get());
        $this->assertSame(1200000.0, $loan->total_payable);

        // Sandbox checkout: the signed URL pays the next installment once, even if submitted twice.
        $url = $this->actingAs($borrower)->post("/account/loans/{$loan->id}/pay", ['pay' => 'next'])->headers->get('Location');
        $this->assertStringContainsString('/pay/sandbox/', $url);
        $this->actingAs($borrower)->post($url)->assertRedirect("/account/loans/{$loan->id}");
        $this->actingAs($borrower)->post($url);
        $this->assertSame(300000.0, $loan->fresh()->amount_paid);
        // A tampered amount breaks the signature.
        $this->actingAs($borrower)->post(str_replace('amount=300000.00', 'amount=1.00', $url))->assertForbidden();

        // Staff payment for the rest closes the loan.
        $this->actingAs($admin)->post("/admin/loans/{$loan->id}/payments", ['amount' => $loan->fresh()->outstanding(), 'paid_on' => today()->toDateString(), 'method' => 'cash']);
        $this->actingAs($borrower)->get('/apply')->assertOk(); // paid off: may apply again
        $this->assertSame('paid', $loan->fresh()->status);
    }

    public function test_stripe_webhook_needs_a_valid_signature(): void
    {
        config(['loan.stripe.webhook_secret' => 'whsec_test']);
        $this->postJson('/webhooks/stripe', ['type' => 'checkout.session.completed'], ['Stripe-Signature' => 't='.time().',v1=bad'])->assertStatus(400);
    }

    public function test_reminders_go_out_once_a_day(): void
    {
        $borrower = User::factory()->create(['country' => 'CO', 'phone' => '+57 300 111 2233']);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($borrower)->post('/apply', $this->application());
        $app = $borrower->applications()->first();
        // Disbursed 6 days ago on a weekly plan: first installment is due tomorrow.
        $this->actingAs($admin)->patch("/admin/applications/{$app->id}", ['status' => 'approved', 'interest_rate' => 25, 'disbursed_at' => today()->subDays(6)->toDateString()]);

        $this->artisan('loans:remind')->assertSuccessful();
        $this->artisan('loans:remind')->assertSuccessful();
        Notification::assertSentToTimes($borrower, PaymentReminder::class, 1);
        // Goes out by email and text; the text before the link fits in one SMS.
        Notification::assertSentTo($borrower, PaymentReminder::class, fn ($n, $channels) => in_array(SmsChannel::class, $channels)
            && strlen(explode(' http', $n->toSms($borrower))[0]) <= 160);
        $this->assertSame('+573001112233', $borrower->routeNotificationForSms());
    }
}
