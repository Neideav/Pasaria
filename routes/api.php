<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryApiController;
use App\Http\Controllers\Api\ProductApiController;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\OrderApiController;
use App\Http\Controllers\Api\ConfigApiController;
use App\Http\Controllers\Api\CartApiController;
use App\Http\Controllers\Api\DeliveryApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider/Application configuration
| within a group which is assigned the "api" middleware group.
|
*/

// Categories
Route::get('/categories', [CategoryApiController::class, 'index']);

// Products & Search
Route::get('/products', [ProductApiController::class, 'index']);
Route::post('/products', [ProductApiController::class, 'store']);
Route::get('/products/{slug}', [ProductApiController::class, 'show']);
Route::delete('/products/{id}', [ProductApiController::class, 'destroy']);

// Authentication
Route::post('/auth/login', [AuthApiController::class, 'login']);
Route::post('/auth/register', [AuthApiController::class, 'register']);

// Orders
Route::post('/orders', [OrderApiController::class, 'store']);
Route::get('/orders', [OrderApiController::class, 'index']);

// Cart
Route::get('/cart', [CartApiController::class, 'getCart']);
Route::post('/cart', [CartApiController::class, 'syncCart']);
Route::delete('/cart', [CartApiController::class, 'clearCart']);

// Deliveries
Route::get('/deliveries', [DeliveryApiController::class, 'index']);
Route::get('/deliveries/{code}', [DeliveryApiController::class, 'show']);
Route::post('/deliveries', [DeliveryApiController::class, 'store']);

// Demo Mode Toggle
Route::get('/config/demo-mode', [ConfigApiController::class, 'getDemoMode']);
Route::post('/config/demo-mode', [ConfigApiController::class, 'toggleDemoMode']);
