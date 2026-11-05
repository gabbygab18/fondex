<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The client asked to drop these from the application form: credit card limits, credit card repayments, debt details.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->dropColumn(['credit_card_limit', 'credit_card_repayments', 'existing_debts_details']);
        });
    }

    public function down(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->text('existing_debts_details')->nullable();
            $table->decimal('credit_card_limit', 15, 2)->default(0);
            $table->decimal('credit_card_repayments', 15, 2)->default(0);
        });
    }
};
