<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\Transfer\StoreTransferRequest;
use App\Models\Transfer;

class TransferController extends Controller
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

        return Transfer::where('title', 'like', "%$q%")
            ->orWhere('description', 'like', "%$q%")
            ->orWhere('amount', 'like', "%$q%")
            ->orWhere('date', 'like', "%$q%")
            ->orderBy('date', 'desc')
            ->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTransferRequest $request)
    {
        $data = $request->validated();

        $transfer = Transfer::create($data);

        return $transfer;
    }

    /**
     * Display the specified resource.
     */
    public function show(Transfer $transfer)
    {
        return $transfer;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreTransferRequest $request, Transfer $transfer)
    {
        $data = $request->validated();

        $transfer->update($data);

        return $transfer;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Transfer $transfer)
    {
        $transfer->delete();

        return $transfer;
    }
}
