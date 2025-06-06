<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\RefundController;
use App\Http\Controllers\SaleController;

Route::post('/v1/login', [AuthController::class, 'login']);

Route::prefix('/v1')->middleware('auth:sanctum')->group(
    function () {
        Route::controller(AuthController::class)->group(function () {
            Route::post('/logout', 'logout');
            Route::get('/user', 'user');
        });

        Route::controller(UnitController::class)->group(function () {
            Route::get('/units', 'index');
            Route::post('/units', 'store');
            Route::get('/units/{unit}', 'show');
            Route::put('/units/{unit}', 'update');
            Route::delete('/units/{unit}', 'destroy');
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
        });

        Route::controller(RefundController::class)->group(function () {
            Route::get('/refunds', 'index');
            Route::post('/refunds', 'store');
            Route::get('/refunds/{refund}', 'show');
            Route::put('/refunds/{refund}', 'update');
            Route::delete('/refunds/{refund}', 'destroy');
        });

        Route::controller(AccountController::class)->group(function () {
            Route::get('/accounts', 'index');
            Route::post('/accounts', 'store');
            Route::get('/accounts/{account}', 'show');
            Route::put('/accounts/{account}', 'update');
            Route::delete('/accounts/{account}', 'destroy');
        });
    }
);
