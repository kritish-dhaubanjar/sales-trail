<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Item;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Http\Requests\PaginationRequest;

class ItemController extends Controller
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

        return Item::where('name', 'like', "%$q%")
            ->orWhere('description', 'like', "%$q%")
            ->orWhere('price', 'like', "%$q%")
            ->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request)
    {
        $data = $request->validated();

        $item = Item::create($data);

        return $item;
    }

    /**
     * Display the specified resource.
     */
    public function show(Item $item)
    {
        return $item;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItemRequest $request, Item $item)
    {
        $data = $request->validated();

        $item->update($data);

        return $item;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item)
    {
        try {
            $item->delete();
        } catch (Exception $error) {
            return response()->json(['message' => $error->getMessage()], 409);
        }

        return $item;
    }
}
