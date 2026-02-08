<?php

namespace App\Http\Controllers;

use App\Events\KOTEvent;
use App\Events\KOTUpdate;
use App\Events\POSEvent;
use App\Events\PrintEstimate;
use App\Http\Requests\PaginationRequest;
use App\Http\Requests\Table\CheckoutTableRequest;
use Exception;
use App\Models\Table;
use App\Http\Requests\Table\StoreTableRequest;
use App\Http\Requests\Table\TransferTableRequest;
use App\Http\Requests\Table\UpdateTableRequest;
use App\Http\Requests\Table\UpdateTableItemRequest;
use App\Models\KOTItem;
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

        $before = $table->items()
            ->get(['item_id', 'quantity'])
            ->map(fn($m) => ['item_id'  => (int)$m->item_id, 'quantity' => (int)$m->quantity])
            ->keyBy('item_id');

        $after = collect($table_items)
            ->map(fn($m) => ['item_id'  => (int)$m['item_id'], 'quantity' => (int)$m['quantity']])
            ->keyBy('item_id');

        $allKeys = $before->keys()->union($after->keys());

        $added = [];
        $removed = [];

        foreach ($allKeys as $id) {
            $prevQty = $before[$id]['quantity'] ?? 0;
            $nextQty = $after[$id]['quantity'] ?? 0;
            $delta   = $nextQty - $prevQty;

            if ($delta > 0) {
                $added[] = [
                    'item_id'       => $id,
                    'quantity_added' => $delta,
                ];
            } elseif ($delta < 0) {
                $removed[] = [
                    'item_id'          => $id,
                    'quantity_removed' => abs($delta),
                ];
            }
            // delta == 0 → unchanged, ignore
        }

        DB::beginTransaction();

        $table->items()->delete();

        $rows = collect($table_items)->map(function ($item) use ($table) {
            return [
                'table_id' => $table->id,
                'item_id' => $item['item_id'],
                'price' => $item['price'],
                'quantity' => $item['quantity'],
                'updated_at' => now(),
                'created_at' => now(),
            ];
        })->toArray();

        DB::table('table_items')->insert($rows, ['table_id', 'item_id'], ['price', 'quantity', 'updated_at']);

        DB::commit();

        event(new POSEvent($table, $added, $removed));

        return $table->fresh('items');
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


            $grand_total = $total - $discount;

            // Extract VAT from inclusive amount
            $vat_amount = ($grand_total * 13) / 113;

            // Taxable amount (optional but recommended)
            $taxable_amount = ($grand_total * 100) / 113;

            $sale = Sale::create([
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
            $table->items()->delete();
            $table->kotItems()->delete();
        } catch (Exception $error) {
            DB::rollBack();
            throw $error;
        }

        DB::commit();

        if ($table->is_delivery) {
            Table::destroy($table->id);
        }

        event(new POSEvent($table, [], []));

        return $sale;
    }

    public function destroyItems(Request $request, Table $table)
    {
        $table_items = $table->items()->get(['item_id', 'quantity']);

        $removed = $table_items->map(fn($m) => ['item_id'  => (int)$m['item_id'], 'quantity_removed' => (int)$m['quantity']])->toArray();

        $table->items()->delete();
        $table->kotItems()->delete();

        if ($table->is_delivery) {
            Table::destroy($table->id);
        }

        event(new POSEvent($table, [], $removed));

        return $table;
    }

    public function print(Request $request, Table $table)
    {
        event(new PrintEstimate($table));

        return $table;
    }

    public function transfer(TransferTableRequest $request, Table $table)
    {
        $data = $request->validated();

        $table_id = $data['table_id'];

        $destinationTable = Table::findOrFail($table_id);

        if ($destinationTable->items()->exists()) {
            return response()->json(['message' => 'Destination table has items.'], 422);
        }

        DB::transaction(function () use ($table, $destinationTable) {
            TableItem::where('table_id', $table->id)->update(['table_id' => $destinationTable->id]);
            KOTItem::where('table_id', $table->id)->update(['table_id' => $destinationTable->id]);
        });

        return $destinationTable;
    }

    public function showKOT(Table $table)
    {
        $kot_items = $table->kotItems();

        return $kot_items;
    }

    public function sendKOT(Table $table)
    {
        $after = $table->items()
            ->get(['item_id', 'quantity'])
            ->map(fn($m) => ['item_id'  => (int)$m->item_id, 'quantity' => (int)$m->quantity, 'name' => $m->item->name])
            ->keyBy('item_id');

        $before = $table->kotItems()
            ->get(['item_id', 'quantity'])
            ->map(fn($m) => ['item_id'  => (int)$m->item_id, 'quantity' => (int)$m->quantity, 'name' => $m->item->name])
            ->keyBy('item_id');

        $allKeys = $before->keys()->union($after->keys());

        $added = [];
        $removed = [];

        foreach ($allKeys as $id) {
            $prevQty = $before[$id]['quantity'] ?? 0;
            $nextQty = $after[$id]['quantity'] ?? 0;
            $delta   = $nextQty - $prevQty;

            if ($delta > 0) {
                $added[] = [
                    'item_id'       => $id,
                    'quantity' => $delta,
                    'name' => $after[$id]['name'],
                ];
            } elseif ($delta < 0) {
                $removed[] = [
                    'item_id'          => $id,
                    'quantity' => $delta,
                    'name' => $before[$id]['name'],
                ];
            }
            // delta == 0 → unchanged, ignore
        }

        $data = [
            'table_id' => $table->id,
            'table' => $table->name,
            'added' => $added,
            'removed' => $removed
        ];

        if (count($added) > 0 || count($removed) > 0) {
            event(new KOTEvent($data));
        }

        return response()->json($data);
    }

    public function updateKOT(Table $table)
    {
        DB::transaction(function () use ($table) {
            $kotItems = collect($table->items()->get())->map(function ($item) {
                return new KOTItem([
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                ]);
            });

            $table->kotItems()->delete();
            $table->kotItems()->saveMany($kotItems);
        });

        event(new KOTUpdate($table));

        return $table;
    }
}
