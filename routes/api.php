<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryApiController;
use App\Http\Controllers\Api\ProductApiController;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\OrderApiController;
use App\Http\Controllers\Api\ConfigApiController;

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
Route::get('/products/{slug}', [ProductApiController::class, 'show']);

// Authentication
Route::post('/auth/login', [AuthApiController::class, 'login']);
Route::post('/auth/register', [AuthApiController::class, 'register']);

// Orders
Route::post('/orders', [OrderApiController::class, 'store']);
Route::get('/orders', [OrderApiController::class, 'index']);

// Demo Mode Toggle
Route::get('/config/demo-mode', [ConfigApiController::class, 'getDemoMode']);
Route::post('/config/demo-mode', [ConfigApiController::class, 'toggleDemoMode']);
