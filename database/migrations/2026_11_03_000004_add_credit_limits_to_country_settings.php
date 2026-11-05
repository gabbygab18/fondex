<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Client limits: new clients start at a lower limit; good payers get it raised by a percentage after each paid-off loan.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('country_settings', function (Blueprint $table) {
            $table->decimal('starting_limit', 15, 2)->nullable()->after('max_amount');
            $table->unsignedSmallInteger('limit_increase_pct')->default(50)->after('starting_limit');
        });
        DB::table('country_settings')->update(['starting_limit' => DB::raw('max_amount / 2')]);
    }

    public function down(): void
    {
        Schema::table('country_settings', function (Blueprint $table) {
            $table->dropColumn(['starting_limit', 'limit_increase_pct']);
        });
    }
};
