<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Shop;
use App\Models\Product;
use App\Models\Order;
use App\Models\Review;
use App\Models\OrderReturn;
use App\Models\Dispute;
use App\Models\Report;
use App\Models\AdminAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminApiController extends Controller
{
    /**
     * Admin dashboard summary metrics from database.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $totalUsers = User::count();
        $totalSellers = Shop::count();
        $totalProducts = Product::count();
        $totalOrders = Order::count();
        $gmv = (float) Order::whereIn('status', ['paid', 'processing', 'packed', 'shipped', 'delivered', 'completed'])->sum('total');

        $pendingReturns = OrderReturn::where('status', 'requested')->count();
        $pendingDisputes = Dispute::where('status', 'open')->count();
        $pendingReports = Report::where('status', 'pending')->count();
        $reportedReviews = Review::where('status', 'flagged')->count();

        $recentOrders = Order::with('user')->orderBy('id', 'desc')->take(5)->get();
        $recentUsers = User::orderBy('id', 'desc')->take(5)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'total_sellers' => $totalSellers,
                'total_products' => $totalProducts,
                'total_orders' => $totalOrders,
                'gmv' => $gmv,
                'pending_returns' => $pendingReturns,
                'pending_disputes' => $pendingDisputes,
                'pending_reports' => $pendingReports,
                'reported_reviews' => $reportedReviews,
                'recent_orders' => $recentOrders,
                'recent_users' => $recentUsers,
            ],
        ]);
    }

    /**
     * List users for admin inspection.
     */
    public function users(Request $request): JsonResponse
    {
        $users = User::with('shop')->orderBy('id', 'desc')->paginate(20);
        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'total' => $users->total(),
        ]);
    }

    /**
     * Suspend or activate user.
     */
    public function updateUserStatus(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User tidak ditemukan.'], 404);
        }

        $newStatus = $request->input('status', 'active');
        $user->status = $newStatus;
        $user->save();

        AdminAction::create([
            'user_id' => $request->user()?->id ?: 1,
            'action' => 'update_user_status',
            'target_type' => 'user',
            'target_id' => $user->id,
            'details_json' => ['new_status' => $newStatus],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status user berhasil diperbarui.',
            'user' => $user,
        ]);
    }

    /**
     * List sellers.
     */
    public function sellers(Request $request): JsonResponse
    {
        $sellers = Shop::with('user')->withCount('products')->orderBy('id', 'desc')->get();
        return response()->json(['success' => true, 'data' => $sellers]);
    }

    /**
     * Approve, reject, or suspend a seller.
     */
    public function updateSellerStatus(Request $request, int $id): JsonResponse
    {
        $shop = Shop::find($id);
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan.'], 404);
        }

        $status = $request->input('status', 'approved');
        $shop->status = $status;
        $shop->verified = ($status === 'approved');
        $shop->save();

        AdminAction::create([
            'user_id' => $request->user()?->id ?: 1,
            'action' => 'update_seller_status',
            'target_type' => 'shop',
            'target_id' => $shop->id,
            'details_json' => ['status' => $status],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status toko berhasil diperbarui.',
            'shop' => $shop,
        ]);
    }

    /**
     * Review moderation (hide/approve).
     */
    public function moderateReview(Request $request, int $id): JsonResponse
    {
        $review = Review::find($id);
        if (!$review) {
            return response()->json(['success' => false, 'message' => 'Ulasan tidak ditemukan.'], 404);
        }

        $status = $request->input('status', 'hidden'); // approved, hidden
        $review->status = $status;
        $review->save();

        AdminAction::create([
            'user_id' => $request->user()?->id ?: 1,
            'action' => 'moderate_review',
            'target_type' => 'review',
            'target_id' => $review->id,
            'details_json' => ['status' => $status],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Moderasi ulasan berhasil disimpan.',
        ]);
    }

    /**
     * List audit logs.
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $logs = AdminAction::with('user')->orderBy('id', 'desc')->take(50)->get();
        return response()->json(['success' => true, 'data' => $logs]);
    }

    /**
     * List platform reports.
     */
    public function reports(Request $request): JsonResponse
    {
        $reports = Report::with('reporter')->orderBy('id', 'desc')->get();
        return response()->json(['success' => true, 'data' => $reports]);
    }
}
