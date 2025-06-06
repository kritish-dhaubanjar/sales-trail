<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Refund;
use App\Models\RefundItem;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreRefundRequest;
use App\Http\Requests\PaginationRequest;

class RefundController extends Controller
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

        return Refund::orderBy('created_at', 'desc')
            ->where('date', 'like', "%$q%")
            ->orWhere('description', 'like', "%$q%")
            ->orWhere('id', 'like', "%$q%")
            ->orWhere('title', 'like', "%$q%")
            ->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRefundRequest $request)
    {
        $data = $request->validated();

        $discount = $data['discount'];
        $refund_items = $data['items'];
        $total = 0;

        DB::beginTransaction();

        try {
            $items = array_map(function ($item) use (&$total) {
                $amt = ($item['quantity'] * $item['price']);
                $item_total = $amt - ($item['discount'] / 100) * $amt;
                $total += $item_total;

                return new RefundItem([
                    'price' => $item['price'],
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'discount' => $item['discount'],
                    'total' => $item_total
                ]);
            }, $refund_items);

            $refund = Refund::create([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => $data['description'],
                'account_id' => $data['account_id'],
                'total' => $total,
                'discount' => $discount,
                'grand_total' => $total - $discount,
            ]);

            $refund->refund_items()->saveMany($items);
        } catch (Exception $error) {
            DB::rollBack();
            throw $error;
        }

        DB::commit();

        return Refund::find($refund->id);
    }

    /**
     * Display the specified resource.
     */
    public function show(Refund $refund)
    {
        return $refund;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreRefundRequest $request, refund $refund)
    {
        $data = $request->validated();

        $discount = $data['discount'];
        $refund_items = $data['items'];
        $total = 0;

        DB::beginTransaction();

        try {
            $refund->refund_items()->forceDelete();

            $items = array_map(function ($item) use (&$total) {
                $amt = ($item['quantity'] * $item['price']);
                $item_total = $amt - ($item['discount'] / 100) * $amt;
                $total += $item_total;

                return new RefundItem([
                    'price' => $item['price'],
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'discount' => $item['discount'],
                    'total' => $item_total
                ]);
            }, $refund_items);


            $refund->update([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => $data['description'],
                'account_id' => $data['account_id'],
                'total' => $total,
                'discount' => $discount,
                'grand_total' => $total - $discount,
            ]);

            $refund->refund_items()->saveMany($items);
        } catch (Exception $error) {
            DB::rollBack();
            throw $error;
        }

        DB::commit();

        return Refund::find($refund->id);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Refund $refund)
    {
        $refund->delete();

        return $refund;
    }
}
