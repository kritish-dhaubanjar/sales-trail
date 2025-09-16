<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class SendDailyAccountReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-daily-account-report';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a daily account report';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (DB::table('table_items')->count() == 0) {
            DB::statement("ALTER TABLE table_items AUTO_INCREMENT = 1");
        }

        $webhook = env('DISCORD_WEBHOOK_URL');

        $accounts = DB::select("SELECT accounts.*,
            COALESCE((
                SELECT SUM(amount) FROM transactions
                WHERE transactions.account_id = accounts.id
                AND transactions.transaction_type = 'App\\\\Models\\\\Sale'
                AND deleted_at IS NULL
            ), 0) -
            COALESCE((
                SELECT SUM(amount) FROM transactions
                WHERE transactions.account_id = accounts.id
                AND transactions.transaction_type = 'App\\\\Models\\\\Purchase'
                AND deleted_at IS NULL
            ), 0) +
            COALESCE((
                SELECT SUM(amount) FROM transfers
                WHERE transfers.to_account_id = accounts.id
                AND deleted_at IS NULL
            ), 0) -
            COALESCE((
                SELECT SUM(amount) FROM transfers
                WHERE transfers.from_account_id = accounts.id
                AND deleted_at IS NULL
            ), 0) +
            accounts.opening_balance
            AS balance
            FROM accounts");

        // Format message
        $message = "**Account Report:**\n```";
        $message .= str_pad("Name", 30) . str_pad("Net Balance", 15) . "\n";
        $message .= str_repeat("-", 45) . "\n";

        $totalBalance = 0;

        foreach ($accounts as $acc) {
            $message .= str_pad($acc->name, 30) . str_pad(number_format($acc->balance, 2), 15) . "\n";
            $totalBalance += $acc->balance;
        }

        $message .= str_repeat("-", 45) . "\n";
        $message .= str_pad('Total', 30) . str_pad(number_format($totalBalance, 2), 15) . "\n";
        $message = rtrim($message) . "```";

        $response = Http::post($webhook, ['content' => $message]);

        if ($response->successful()) {
            $this->info('Report sent successfully.');
        } else {
            $this->error('Failed to send report.');
        }
    }
}
