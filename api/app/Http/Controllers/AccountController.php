<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use Exception;
use Illuminate\Http\Request;

class AccountController extends Controller
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

        $query = Account::query()
            ->select('accounts.*')
            ->selectRaw("
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
            ), 0) AS balance
        ")
            ->when($q, function ($query) use ($q) {
                $query->where(function ($query) use ($q) {
                    $query->where('id', 'like', "%$q%")
                        ->orWhere('name', 'like', "%$q%");
                });
            })
            ->orderBy('created_at', 'desc');

        return $query->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAccountRequest $request)
    {
        $data = $request->validated();

        $item = Account::create($data);

        return $item;
    }

    /**
     * Display the specified resource.
     */
    public function show(Account $account)
    {
        return $account;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAccountRequest $request, Account $account)
    {
        $data = $request->validated();

        $account->update($data);

        return $account;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Account $account)
    {
        try {
            $account->delete();
        } catch (Exception $error) {
            return response()->json(['message' => $error->getMessage()], 409);
        }

        return $account;
    }
}
