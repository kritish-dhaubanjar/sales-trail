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
            $table->string('fiscal_year', 7)->nullable(); // 2083/84
            $table->integer('invoice_id')->nullable();
            $table->unique(['fiscal_year', 'invoice_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropUnique(['fiscal_year', 'invoice_id']);
            $table->dropColumn('fiscal_year');
            $table->dropColumn('invoice_id');
        });
    }
};
