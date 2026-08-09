<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Support\Facades\DB;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Transaction;

use App\Events\PrintReceipt;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\PaginationRequest;
use App\Utils\FiscalYear;

class SaleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(PaginationRequest $request)
    {
        $data = $request->validated();

        $q = $data['q'] ?? "";
        $page = $data['page'] ?? 1;
        $limit = $data['limit'] ?? 10;

        return Sale::orderBy('created_at', 'desc')
            ->where('date', 'like', "%$q%")
            ->orWhere('description', 'like', "%$q%")
            ->orWhere('id', 'like', "%$q%")
            ->orWhere('title', 'like', "%$q%")
            ->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSaleRequest $request)
    {
        $data = $request->validated();

        $discount = $data['discount'];
        $sale_items = $data['items'];
        $sale_transactions = $data['transactions'];
        $total = 0;

        DB::beginTransaction();

        try {
            $items = array_map(function ($item) use (&$total) {
                $amt = ($item['quantity'] * $item['price']);
                $item_total = $amt - ($item['discount'] / 100) * $amt;
                $total += $item_total;

                return new SaleItem([
                    'price' => $item['price'],
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'discount' => $item['discount'],
                    'total' => $item_total
                ]);
            }, $sale_items);

            $transactions = array_map(function ($transaction) {
                return new Transaction([
                    'account_id' => $transaction['account_id'],
                    'amount' => $transaction['amount']
                ]);
            }, $sale_transactions);

            $grand_total = $total - $discount;

            // Extract VAT from inclusive amount
            $vat_amount = ($grand_total * 13) / 113;

            // Taxable amount (optional but recommended)
            $taxable_amount = ($grand_total * 100) / 113;

            $fiscal_year = FiscalYear::getFiscalYearFromDate($data['date']);

            $latest_invoice_id = Sale::withTrashed()->where('fiscal_year', $fiscal_year)->max('invoice_id');

            $invoice_id = ($latest_invoice_id ?? 0) + 1;

            $sale = Sale::create([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => "",
                'total' => $total,
                'discount' => $discount,
                'taxable_amount' => $taxable_amount,
                'vat_amount' => $vat_amount,
                'grand_total' => $grand_total,
                'fiscal_year' => $fiscal_year,
                'invoice_id' => $invoice_id,
            ]);

            $sale->sale_items()->saveMany($items);
            $sale->transactions()->saveMany($transactions);
        } catch (Exception $error) {
            DB::rollBack();
            throw $error;
        }

        DB::commit();

        return Sale::find($sale->id);
    }

    /**
     * Display the specified resource.
     */
    public function show(Sale $sale)
    {
        return $sale;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreSaleRequest $request, Sale $sale)
    {
        $data = $request->validated();

        $discount = $data['discount'];
        $sale_items = $data['items'];
        $sale_transactions = $data['transactions'];
        $total = 0;

        DB::beginTransaction();

        try {
            $sale->sale_items()->forceDelete();
            $sale->transactions()->forceDelete();

            $items = array_map(function ($item) use (&$total) {
                $amt = ($item['quantity'] * $item['price']);
                $item_total = $amt - ($item['discount'] / 100) * $amt;
                $total += $item_total;

                return new SaleItem([
                    'price' => $item['price'],
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'discount' => $item['discount'],
                    'total' => $item_total
                ]);
            }, $sale_items);

            $transactions = array_map(function ($transaction) {
                return new Transaction(['account_id' => $transaction['account_id'], 'amount' => $transaction['amount']]);
            }, $sale_transactions);

            $grand_total = $total - $discount;

            // Extract VAT from inclusive amount
            $vat_amount = ($grand_total * 13) / 113;

            // Taxable amount (optional but recommended)
            $taxable_amount = ($grand_total * 100) / 113;

            $sale->update([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => "",
                'total' => $total,
                'discount' => $discount,
                'taxable_amount' => $taxable_amount,
                'vat_amount' => $vat_amount,
                'grand_total' => $grand_total,
            ]);

            $sale->sale_items()->saveMany($items);
            $sale->transactions()->saveMany($transactions);
        } catch (Exception $error) {
            DB::rollBack();
            throw $error;
        }

        DB::commit();

        return Sale::find($sale->id);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sale $sale)
    {
        $sale->delete();

        return $sale;
    }

    public function print(Sale $sale)
    {
        event(new PrintReceipt($sale));

        return $sale;
    }
}
