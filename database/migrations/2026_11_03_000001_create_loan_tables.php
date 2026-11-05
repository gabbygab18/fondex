<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('country_settings', function (Blueprint $table) {
            $table->id();
            $table->string('code', 2)->unique();
            $table->string('name');
            $table->string('currency', 3);
            $table->decimal('min_amount', 15, 2);
            $table->decimal('max_amount', 15, 2);
            $table->unsignedTinyInteger('min_term')->default(1);
            $table->unsignedTinyInteger('max_term')->default(3);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('loan_applications', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('country', 2)->index();
            $table->string('currency', 3);

            // 4. Loan details
            $table->string('loan_type');
            $table->decimal('amount', 15, 2);
            $table->unsignedTinyInteger('term_months');
            $table->string('repayment_frequency');
            $table->string('purpose');

            // 1. Personal information
            $table->string('full_name');
            $table->date('date_of_birth');
            $table->string('gender')->nullable();
            $table->string('marital_status')->nullable();
            $table->string('email');
            $table->string('phone');
            $table->string('address');
            $table->string('city');

            // 2. Employment
            $table->string('employment_status');
            $table->string('employer_name')->nullable();
            $table->string('occupation')->nullable();
            $table->string('employment_length')->nullable();

            // 3. Financial
            $table->decimal('monthly_income', 15, 2);
            $table->decimal('other_income', 15, 2)->default(0);
            $table->string('other_income_source')->nullable();
            $table->decimal('monthly_expenses', 15, 2);
            $table->decimal('existing_debts', 15, 2)->default(0);
            $table->text('existing_debts_details')->nullable();
            $table->decimal('credit_card_limit', 15, 2)->default(0);
            $table->decimal('credit_card_repayments', 15, 2)->default(0);
            $table->text('other_commitments')->nullable();

            // 5. Identification (number encrypted at rest)
            $table->string('id_type');
            $table->text('id_number');
            $table->string('id_issuing_country', 2);
            $table->date('id_expiry')->nullable();

            // 6. Banking (account number encrypted at rest)
            $table->string('bank_name');
            $table->string('account_holder');
            $table->string('account_type')->nullable();
            $table->text('account_number');

            // 7. Consents and declarations
            $table->boolean('consent_privacy')->default(false);
            $table->boolean('consent_data_use')->default(false);
            $table->boolean('consent_credit_check')->default(false);
            $table->boolean('declaration_accurate')->default(false);
            $table->timestamp('consented_at')->nullable();
            $table->string('consent_ip', 45)->nullable();

            $table->text('notes')->nullable();
            $table->string('status')->default('pending')->index();
            $table->decimal('interest_rate', 5, 2)->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index('created_at');
        });

        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_application_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime');
            $table->unsignedInteger('size');
            $table->timestamps();
        });

        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('loan_application_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('country', 2)->index();
            $table->string('currency', 3);
            $table->decimal('principal', 15, 2);
            $table->decimal('interest_rate', 5, 2);
            $table->unsignedTinyInteger('term_months');
            $table->string('repayment_frequency');
            $table->unsignedSmallInteger('installment_count');
            $table->decimal('installment_amount', 15, 2);
            $table->decimal('total_payable', 15, 2);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->string('status')->default('active')->index();
            $table->date('disbursed_at');
            $table->timestamps();
        });

        Schema::create('installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('number');
            $table->date('due_date')->index();
            $table->decimal('principal', 15, 2);
            $table->decimal('interest', 15, 2);
            $table->decimal('amount_due', 15, 2);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->timestamp('paid_at')->nullable();
            $table->date('reminded_on')->nullable();
            $table->unique(['loan_id', 'number']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->date('paid_on');
            $table->string('method');
            $table->string('reference')->nullable();
            // Set for online payments; unique so a replayed webhook can't record the same payment twice.
            $table->string('gateway_ref')->nullable()->unique();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('installments');
        Schema::dropIfExists('loans');
        Schema::dropIfExists('application_documents');
        Schema::dropIfExists('loan_applications');
        Schema::dropIfExists('country_settings');
    }
};
