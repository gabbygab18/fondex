<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Manual cash book entries in Accounting: money in or out that isn't a loan disbursement or a loan payment
// (capital put in, office expenses, owner withdrawals, other income).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_entries', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->string('currency', 3);
            $table->string('direction', 3); // in | out
            $table->string('category', 20);
            $table->string('description', 255);
            $table->decimal('amount', 15, 2);
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_entries');
    }
};
