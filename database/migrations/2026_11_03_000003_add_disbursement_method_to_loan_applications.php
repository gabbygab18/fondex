<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// How the borrower receives the money: bank transfer, or cash picked up in person (then no bank details are needed).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->string('disbursement_method')->default('bank')->after('declaration_accurate');
            $table->string('bank_name')->nullable()->change();
            $table->string('account_holder')->nullable()->change();
            $table->text('account_number')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('loan_applications', function (Blueprint $table) {
            $table->dropColumn('disbursement_method');
        });
    }
};
