<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\Table\CheckoutTableRequest;
use Exception;
use App\Models\Table;
use App\Http\Requests\Table\StoreTableRequest;
use App\Http\Requests\Table\UpdateTableRequest;
use App\Http\Requests\Table\UpdateTableItemRequest;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\TableItem;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TableController extends Controller
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

        return Table::where('name', 'like', "%$q%")->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTableRequest $request)
    {
        $data = $request->validated();

        $table = Table::create($data);

        return $table;
    }

    /**
     * Display the specified resource.
     */
    public function show(Table $table)
    {
        return $table;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTableRequest $request, Table $table)
    {
        $data = $request->validated();

        $table->update($data);

        return $table;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Table $table)
    {
        try {
            $table->delete();
        } catch (Exception $error) {
            return response()->json(['message' => $error->getMessage()], 409);
        }

        return $table;
    }

    public function updateItems(UpdateTableItemRequest $request, Table $table)
    {
        $data = $request->validated();

        $table_items = $data['items'] ?? [];

        $items = array_map(function ($item) {
            return new TableItem([
                'item_id' => $item['item_id'],
                'price' => $item['price'],
                'quantity' => $item['quantity'],
            ]);
        }, $table_items);

        $table->items()->delete();
        $table->items()->saveMany($items);

        return Table::find($table->id);
    }

    public function checkout(CheckoutTableRequest $request, Table $table)
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
                $item_total = $amt;
                $total += $item_total;

                return new SaleItem([
                    'price' => $item['price'],
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'discount' => 0,
                    'total' => $item_total
                ]);
            }, $sale_items);

            $transactions = array_map(function ($transaction) {
                return new Transaction(['account_id' => $transaction['account_id'], 'amount' => $transaction['amount']]);
            }, $sale_transactions);

            $sale = Sale::create([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => "",
                'total' => $total,
                'discount' => $discount,
                'grand_total' => $total - $discount,
            ]);

            $sale->sale_items()->saveMany($items);
            $sale->transactions()->saveMany($transactions);
            $table->items()->delete();
        } catch (Exception $error) {
            DB::rollBack();
            throw $error;
        }

        DB::commit();

        if ($table->is_delivery) {
            Table::destroy($table->id);
        }

        return $table;
    }

    public function destroyItems(Table $table)
    {
        $table->items()->delete();

        if ($table->is_delivery) {
            Table::destroy($table->id);
        }

        return $table;
    }
}
