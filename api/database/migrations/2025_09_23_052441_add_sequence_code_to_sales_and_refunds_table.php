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
            $table->string('sequence_code')->nullable()->after('sequence_no');
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->string('sequence_code')->nullable()->after('sequence_no');
        });

        $sales = DB::table('sales')->whereNull('deleted_at')->orderBy('created_at')->get();

        foreach ($sales as $sale) {
            $sequenceCode = self::generateSequenceCode($sale->sequence_no);
            DB::table('sales')->where('id', $sale->id)->update(['sequence_code' => $sequenceCode]);
        }

        $refunds = DB::table('refunds')->whereNull('deleted_at')->orderBy('created_at')->get();

        foreach ($refunds as $refund) {
            $sequenceCode = self::generateSequenceCode($sale->sequence_no);
            DB::table('refunds')->where('id', $refund->id)->update(['sequence_code' => $sequenceCode]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('sequence_code');
        });

        Schema::table('refunds', function (Blueprint $table) {
            $table->dropColumn('sequence_code');
        });
    }

    public static function generateSequenceCode(int $id): string
    {
        $size = 500;

        $segment = intdiv($id - 1, $size);
        $number = ($id - 1) % $size + 1;

        $letters = '';

        for ($n = $segment; $n >= 0; $n = intdiv($n, 26) - 1) {
            $letters = chr($n % 26 + 65) . $letters;
        }

        $padded = str_pad($number, 3, '0', STR_PAD_LEFT);

        return $letters . $padded;
    }
};
