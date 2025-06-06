<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccountSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $items = [
            ['name' => 'Cash', 'id' => 1],
            ['name' => 'Esewa', 'id' => 2],
            ['name' => 'Khalti', 'id' => 3],
        ];

        DB::table('accounts')->insert($items);
    }
}
