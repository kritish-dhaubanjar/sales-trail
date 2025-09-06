<?php

namespace App\Http\Controllers;

use App\Http\Requests\DashboardRequest;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(DashboardRequest $request)
    {
        $data = $request->validated();

        $startDate = $data['start_date'];
        $endDate = $data['end_date'];

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

        $transactions = DB::select("SELECT
                transactions.account_id,
                accounts.name,
                transactions.transaction_type,
                SUM(transactions.amount)             AS amount,
                COALESCE(sales.date, purchases.date) AS date
            FROM
                transactions
                INNER JOIN accounts ON accounts.id = transactions.account_id
                LEFT JOIN sales ON sales.id = transactions.transaction_id AND transactions.transaction_type = 'App\\\\Models\\\\Sale'
                LEFT JOIN purchases ON purchases.id = transactions.transaction_id AND transactions.transaction_type = 'App\\\\Models\\\\Purchase'
            WHERE
                transactions.deleted_at IS NULL AND COALESCE(sales.date, purchases.date) BETWEEN ? AND ?
            GROUP BY
                COALESCE(sales.date, purchases.date),
                transactions.account_id,
                accounts.name,
                transactions.transaction_type
            ORDER BY
                date ASC
            ", [$startDate, $endDate]);

        $sales = [
            'total' => Sale::whereBetween('date', [$startDate, $endDate])->sum('grand_total'),
            'data' => DB::select("SELECT date, SUM(grand_total) AS grand_total FROM sales WHERE date BETWEEN ? AND ? AND deleted_at IS NULL GROUP BY date ORDER BY date ASC", [$startDate, $endDate]),
            'items' => DB::select("SELECT sale_items.item_id, items.name, SUM(sale_items.quantity) AS quantity FROM sale_items INNER JOIN sales ON sales.id = sale_items.sale_id INNER JOIN items ON sale_items.item_id = items.id WHERE sales.date BETWEEN ? AND ? AND sales.deleted_at IS NULL GROUP BY items.name, sale_items.item_id ORDER BY quantity DESC", [$startDate, $endDate])
        ];

        $purchases = [
            'total' => Purchase::whereBetween('date', [$startDate, $endDate])->sum('grand_total'),
            'data' => DB::select("SELECT date, SUM(grand_total) AS grand_total FROM purchases WHERE date BETWEEN ? AND ? AND purchases.deleted_at IS NULL GROUP BY date ORDER BY date ASC", [$startDate, $endDate]),
            'items' => DB::select("SELECT purchase_items.item_id, items.name, SUM(purchase_items.quantity) AS quantity FROM purchase_items INNER JOIN purchases ON purchases.id = purchase_items.purchase_id INNER JOIN items ON purchase_items.item_id = items.id WHERE purchases.date BETWEEN ? AND ? AND purchases.deleted_at IS NULL GROUP BY items.name, purchase_items.item_id ORDER BY quantity DESC", [$startDate, $endDate])
        ];

        return response()->json([
            'accounts' => $accounts,
            'sales' => $sales,
            'purchases' =>  $purchases,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'transactions' => $transactions
        ]);
    }
}
