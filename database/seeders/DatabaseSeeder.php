<?php

namespace Database\Seeders;

use App\Models\CountrySetting;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        CountrySetting::insert([
            ['code' => 'AR', 'name' => 'Argentina', 'currency' => 'ARS', 'min_amount' => 50000, 'max_amount' => 3000000, 'starting_limit' => 1500000, 'limit_increase_pct' => 50, 'min_term' => 1, 'max_term' => 3, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'CO', 'name' => 'Colombia', 'currency' => 'COP', 'min_amount' => 200000, 'max_amount' => 10000000, 'starting_limit' => 5000000, 'limit_increase_pct' => 50, 'min_term' => 1, 'max_term' => 3, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Live site: ask for the real admin login instead of the demo one, and no demo staff or borrowers.
        if (! app()->isLocal()) {
            // Ask again until filled in (a blank answer would fail on insert).
            $ask = function (string $q, callable $ok, bool $secret = false) {
                do {
                    $v = trim((string) ($secret ? $this->command->secret($q) : $this->command->ask($q)));
                } while (! $ok($v) && ! $this->command->error('Try again.'));

                return $v;
            };
            User::create([
                'name' => $this->command->ask('Admin name', 'Admin'),
                'email' => $ask('Admin email', fn ($v) => filter_var($v, FILTER_VALIDATE_EMAIL)),
                'password' => $ask('Admin password (12+ characters)', fn ($v) => strlen($v) >= 12, true),
                'role' => 'admin', 'locale' => 'es',
            ]);

            return;
        }

        User::create(['name' => 'Admin', 'email' => 'admin@fondex.test', 'password' => 'password', 'role' => 'admin', 'locale' => 'en']);
        User::create(['name' => 'Laura Gómez', 'email' => 'staff@fondex.test', 'password' => 'password', 'role' => 'staff']);

        // Demo borrowers so the admin portal has something to show.
        // [name, country, amount, months, frequency, loan type, status, days ago, rate if approved]
        $demo = [
            ['Martina Fernández', 'AR', 600000, 3, 'weekly', 'personal', 'approved', 40, 25],
            ['Santiago Rojas', 'CO', 3000000, 2, 'fortnightly', 'debt_consolidation', 'approved', 35, 20],
            ['Valentina López', 'CO', 1500000, 1, 'weekly', 'education', 'pending', 2, null],
            ['Joaquín Pérez', 'AR', 250000, 1, 'daily', 'emergency', 'under_review', 5, null],
            ['Camila Herrera', 'CO', 5000000, 3, 'fortnightly', 'home_improvement', 'rejected', 20, null],
            ['Mateo Díaz', 'AR', 900000, 2, 'daily', 'medical', 'approved', 25, 30],
            ['Isabella Castro', 'CO', 800000, 1, 'weekly', 'vehicle', 'pending', 1, null],
        ];

        foreach ($demo as $i => [$name, $country, $amount, $term, $freq, $type, $status, $daysAgo, $rate]) {
            $ar = $country === 'AR';
            $email = 'borrower'.($i + 1).'@fondex.test';
            $phone = $ar ? '+54 11 5555 01'.$i.$i : '+57 300 555 01'.$i.$i;
            $user = User::create(['name' => $name, 'email' => $email, 'password' => 'password', 'phone' => $phone, 'country' => $country]);
            $app = $user->applications()->create([
                'country' => $country, 'currency' => $ar ? 'ARS' : 'COP',
                'loan_type' => $type, 'amount' => $amount, 'term_months' => $term, 'repayment_frequency' => $freq,
                'purpose' => ['Pay a medical bill', 'Consolidate two credit cards', 'Semester fees', 'Car repair', 'Kitchen renovation', 'Dental treatment', 'Motorbike down payment'][$i],
                'full_name' => $name, 'date_of_birth' => now()->subYears(24 + $i * 3)->toDateString(), 'gender' => $i % 2 ? 'male' : 'female',
                'marital_status' => ['single', 'married', 'single', 'de_facto', 'married', 'divorced', 'single'][$i],
                'email' => $email, 'phone' => $phone,
                'address' => 'Calle '.(10 + $i).' # 45-'.(20 + $i), 'city' => $ar ? 'Buenos Aires' : 'Bogotá',
                'employment_status' => ['employed', 'employed', 'casual', 'self_employed', 'employed', 'self_employed', 'employed'][$i],
                'employer_name' => ['Panadería Sol', 'Estudio Norte', 'Café Central', 'Taller Pérez', 'Clínica Andes', 'Díaz Servicios', 'Tienda Lua'][$i],
                'occupation' => ['Baker', 'Graphic designer', 'Barista', 'Mechanic', 'Nurse', 'Electrician', 'Sales assistant'][$i],
                'employment_length' => ['3 years', '5 years', '8 months', '6 years', '4 years', '2 years', '1 year'][$i],
                'monthly_income' => $amount / 2, 'other_income' => $i % 3 ? 0 : $amount / 10, 'other_income_source' => $i % 3 ? null : 'Freelance work',
                'monthly_expenses' => $amount / 4, 'existing_debts' => $i % 2 ? $amount / 5 : 0,
                'id_type' => ['national_id', 'drivers_licence', 'passport'][$i % 3], 'id_number' => (string) (20000000 + $i * 1234567), 'id_issuing_country' => $country,
                'id_expiry' => now()->addYears(4)->toDateString(),
                'disbursement_method' => 'bank', 'bank_name' => $ar ? 'Banco Nación' : 'Bancolombia', 'account_holder' => $name,
                'account_type' => $ar ? null : 'savings',
                'account_number' => $ar ? '28500109'.str_pad((string) (1234560 + $i), 14, '0', STR_PAD_LEFT) : '0123456'.$i.'89',
                'consent_privacy' => true, 'consent_data_use' => true, 'consent_credit_check' => true, 'declaration_accurate' => true,
                'consented_at' => now()->subDays($daysAgo), 'consent_ip' => '127.0.0.1',
                'status' => $status, 'interest_rate' => $rate,
                'created_at' => now()->subDays($daysAgo), 'updated_at' => now()->subDays($daysAgo),
                'reviewed_at' => in_array($status, ['approved', 'rejected']) ? now()->subDays($daysAgo - 1) : null,
            ]);

            // Tiny placeholder files so the document links work in the demo.
            foreach (['id_front' => 'id-front.pdf', 'address_proof' => 'proof-of-address.pdf', 'income_proof' => 'payslip.pdf'] as $docType => $file) {
                $path = "applications/{$app->id}/{$file}";
                Storage::disk('local')->put($path, "%PDF-1.4\n% demo document for {$name}\n");
                $app->documents()->create(['type' => $docType, 'path' => $path, 'original_name' => $file, 'mime' => 'application/pdf', 'size' => 64]);
            }

            if ($status === 'approved') {
                $loan = Loan::createFromApplication($app, $rate, now()->subDays($daysAgo - 1));
                // Pay what's already due, except leave the daily loan a few behind so overdue rows show up.
                foreach ($loan->installments()->whereDate('due_date', '<', today())->get() as $k => $inst) {
                    if ($freq === 'daily' && $k >= 18) {
                        break;
                    }
                    $loan->recordPayment($inst->amount_due, ['paid_on' => $inst->due_date, 'method' => $ar ? 'mercado_pago' : 'pse']);
                }
            }
        }
    }
}
