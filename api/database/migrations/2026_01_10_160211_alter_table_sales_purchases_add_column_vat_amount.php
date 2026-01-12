<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->after('discount', function (Blueprint $table) {
                $table->double('taxable_amount', 15, 2)->default(0);
                $table->double('vat_amount', 15, 2)->default(0);
            });
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->after('discount', function (Blueprint $table) {
                $table->double('taxable_amount', 15, 2)->default(0);
                $table->double('vat_amount', 15, 2)->default(0);
            });
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('taxable_amount');
            $table->dropColumn('vat_amount');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn('taxable_amount');
            $table->dropColumn('vat_amount');
        });
    }
};
