<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->unsignedInteger('sequence_no')->nullable()->index();
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->unsignedInteger('sequence_no')->nullable()->index();
        });

        $sequenceNo = 1;
        $sales = DB::table('sales')->whereNull('deleted_at')->orderBy('created_at')->get();

        foreach ($sales as $sale) {
            DB::table('sales')->where('id', $sale->id)->update(['sequence_no' => $sequenceNo++]);
        }

        $sequenceNo = 1;
        $refunds = DB::table('refunds')->whereNull('deleted_at')->orderBy('created_at')->get();

        foreach ($refunds as $refund) {
            DB::table('refunds')->where('id', $refund->id)->update(['sequence_no' => $sequenceNo++]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['sequence_no']);
            $table->dropColumn('sequence_no');
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->dropIndex(['sequence_no']);
            $table->dropColumn('sequence_no');
        });
    }
};
