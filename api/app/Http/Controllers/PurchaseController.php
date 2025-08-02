<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Support\Facades\DB;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Transaction;

use App\Http\Requests\StorePurchaseRequest;
use App\Http\Requests\PaginationRequest;

class PurchaseController extends Controller
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

        return Purchase::orderBy('created_at', 'desc')
            ->where('date', 'like', "%$q%")
            ->orWhere('description', 'like', "%$q%")
            ->orWhere('id', 'like', "%$q%")
            ->orWhere('title', 'like', "%$q%")
            ->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePurchaseRequest $request)
    {
        $data = $request->validated();

        $discount = $data['discount'];
        $purchase_items = $data['items'];
        $purchase_transactions = $data['transactions'];
        $total = 0;

        DB::beginTransaction();

        try {
            $items = array_map(function ($item) use (&$total) {
                $amt = ($item['quantity'] * $item['price']);
                $item_total = $amt - ($item['discount'] / 100) * $amt;
                $total += $item_total;

                return new PurchaseItem([
                    'price' => $item['price'],
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'discount' => $item['discount'],
                    'total' => $item_total
                ]);
            }, $purchase_items);

            $transactions = array_map(function ($transaction) {
                return new Transaction(['account_id' => $transaction['account_id'], 'amount' => $transaction['amount']]);
            }, $purchase_transactions);

            $purchase = Purchase::create([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => $data['description'],
                'total' => $total,
                'discount' => $discount,
                'grand_total' => $total - $discount,
            ]);

            $purchase->purchase_items()->saveMany($items);
            $purchase->transactions()->saveMany($transactions);
        } catch (Exception $error) {
            DB::rollBack();
            throw $error;
        }

        DB::commit();

        return Purchase::find($purchase->id);
    }

    /**
     * Display the specified resource.
     */
    public function show(Purchase $purchase)
    {
        return $purchase;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StorePurchaseRequest $request, Purchase $purchase)
    {
        $data = $request->validated();

        $discount = $data['discount'];
        $purchase_items = $data['items'];
        $purchase_transactions = $data['transactions'];
        $total = 0;

        DB::beginTransaction();

        try {
            $purchase->purchase_items()->forceDelete();
            $purchase->transactions()->forceDelete();

            $items = array_map(function ($item) use (&$total) {
                $amt = ($item['quantity'] * $item['price']);
                $item_total = $amt - ($item['discount'] / 100) * $amt;
                $total += $item_total;

                return new PurchaseItem([
                    'price' => $item['price'],
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'discount' => $item['discount'],
                    'total' => $item_total
                ]);
            }, $purchase_items);

            $transactions = array_map(function ($transaction) {
                return new Transaction(['account_id' => $transaction['account_id'], 'amount' => $transaction['amount']]);
            }, $purchase_transactions);

            $purchase->update([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => $data['description'],
                'total' => $total,
                'discount' => $discount,
                'grand_total' => $total - $discount,
            ]);

            $purchase->purchase_items()->saveMany($items);
            $purchase->transactions()->saveMany($transactions);
        } catch (Exception $error) {
            DB::rollBack();
            throw $error;
        }

        DB::commit();

        return Purchase::find($purchase->id);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Purchase $purchase)
    {
        $purchase->delete();

        return $purchase;
    }
}
