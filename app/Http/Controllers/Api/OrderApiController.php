<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderApiController extends Controller
{
    /**
     * Create a new order.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $customerName = $request->input('customer_name', 'Customer');
            $customerEmail = $request->input('customer_email', 'customer@shopcart.com');
            $shippingAddress = $request->input('shipping_address', '4140 Parker Rd. Allentown, New Mexico 31134');
            $paymentMethod = $request->input('payment_method', 'Credit or Debit Card');
            $subtotal = (float) $request->input('subtotal', 0);
            $tax = (float) $request->input('tax', 0);
            $discount = (float) $request->input('discount', 0);
            $shippingCost = (float) $request->input('shipping_cost', 0);
            $total = (float) $request->input('total', 0);
            $items = $request->input('items', []);

            $orderNumber = (string) rand(1000000000, 9999999999);

            $order = Order::create([
                'order_number' => $orderNumber,
                'user_id' => 1,
                'customer_name' => $customerName,
                'customer_email' => $customerEmail,
                'shipping_address' => $shippingAddress,
                'payment_method' => $paymentMethod,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => $discount,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'status' => 'Processing',
                'items_json' => is_array($items) ? $items : json_decode($items, true),
            ]);

            // Create individual order items if available
            if (is_array($items)) {
                foreach ($items as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['id'] ?? null,
                        'product_name' => $item['name'] ?? 'Product',
                        'price' => $item['price'] ?? 0,
                        'quantity' => $item['quantity'] ?? 1,
                        'color' => $item['color'] ?? null,
                        'image' => $item['image'] ?? null,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'order_number' => $orderNumber,
                'transaction_id' => $orderNumber,
                'message' => 'Order created successfully',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List all orders.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $orders = Order::orderBy('id', 'desc')->get()->map(function ($order) {
                $item = $order->toArray();
                $item['items'] = is_array($order->items_json) ? $order->items_json : (json_decode($order->items_json, true) ?? []);
                return $item;
            });

            return response()->json([
                'success' => true,
                'data' => $orders,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
