<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\PaginationRequest;

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

            $sale = Sale::create([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => $data['description'],
                'total' => $total,
                'discount' => $discount,
                'grand_total' => $total - $discount,
            ]);

            $sale->sale_items()->saveMany($items);
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
        $total = 0;

        DB::beginTransaction();

        try {
            $sale->sale_items()->forceDelete();

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


            $sale->update([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => $data['description'],
                'total' => $total,
                'discount' => $discount,
                'grand_total' => $total - $discount,
            ]);

            $sale->sale_items()->saveMany($items);
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
}
