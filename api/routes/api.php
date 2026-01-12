<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\RefundController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\TableController;
use App\Http\Controllers\TransferController;
use Illuminate\Support\Facades\Broadcast;

Route::post('/v1/login', [AuthController::class, 'login']);

Route::prefix('/v1')->middleware('auth:sanctum')->group(
    function () {
        Broadcast::routes(['middleware' => ['auth:sanctum']]);

        Route::controller(AuthController::class)->group(function () {
            Route::post('/logout', 'logout');
            Route::get('/user', 'user');
            Route::post('/change-password', 'changePassword');
        });

        Route::controller(UnitController::class)->group(function () {
            Route::get('/units', 'index');
            Route::post('/units', 'store');
            Route::get('/units/{unit}', 'show');
            Route::put('/units/{unit}', 'update');
            Route::delete('/units/{unit}', 'destroy');
        });

        Route::controller(TableController::class)->group(function () {
            Route::get('/tables', 'index');
            Route::post('/tables', 'store');
            Route::get('/tables/{table}', 'show');
            Route::put('/tables/{table}', 'update');
            Route::delete('/tables/{table}', 'destroy');
            Route::put('/tables/{table}/checkout', 'checkout');
            Route::post('/tables/{table}/print', 'print');

            Route::put('/tables/{table}/items', 'updateItems');
            Route::delete('/tables/{table}/items', 'destroyItems');
        });

        Route::controller(ItemController::class)->group(function () {
            Route::get('/items', 'index');
            Route::post('/items', 'store');
            Route::get('/items/{item}', 'show');
            Route::put('/items/{item}', 'update');
            Route::delete('/items/{item}', 'destroy');
        });

        Route::controller(SaleController::class)->group(function () {
            Route::get('/sales', 'index');
            Route::post('/sales', 'store');
            Route::get('/sales/{sale}', 'show');
            Route::put('/sales/{sale}', 'update');
            Route::delete('/sales/{sale}', 'destroy');
            Route::post('/sales/{sale}/print', 'print');
        });

        Route::controller(RefundController::class)->group(function () {
            Route::get('/refunds', 'index');
            Route::post('/refunds', 'store');
            Route::get('/refunds/{refund}', 'show');
            Route::put('/refunds/{refund}', 'update');
            Route::delete('/refunds/{refund}', 'destroy');
        });

        Route::controller(PurchaseController::class)->group(function () {
            Route::get('/purchases', 'index');
            Route::post('/purchases', 'store');
            Route::get('/purchases/{purchase}', 'show');
            Route::put('/purchases/{purchase}', 'update');
            Route::delete('/purchases/{purchase}', 'destroy');
        });

        Route::controller(AccountController::class)->group(function () {
            Route::get('/accounts', 'index');
            Route::post('/accounts', 'store');
            Route::get('/accounts/{account}', 'show');
            Route::put('/accounts/{account}', 'update');
            Route::delete('/accounts/{account}', 'destroy');
        });

        Route::controller(TransferController::class)->group(function () {
            Route::get('/transfers', 'index');
            Route::post('/transfers', 'store');
            Route::get('/transfers/{transfer}', 'show');
            Route::put('/transfers/{transfer}', 'update');
            Route::delete('/transfers/{transfer}', 'destroy');
        });

        Route::controller(CategoryController::class)->group(function () {
            Route::get('/categories', 'index');
            Route::post('/categories', 'store');
            Route::get('/categories/{category}', 'show');
            Route::put('/categories/{category}', 'update');
            Route::delete('/categories/{category}', 'destroy');
        });

        Route::controller(DashboardController::class)->group(function () {
            Route::get('/dashboard', 'index');
        });
    }
);
