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
        $user = $request->user();
        if (!$user || (!$user->isAdmin() && !$user->isSupport())) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

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
     * List users for admin inspection with pagination.
     */
    public function users(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isAdmin() && !$user->isSupport())) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $perPage = min(50, max(5, (int) $request->input('per_page', 20)));
        $users = User::with('shop')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'total' => $users->total(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Suspend or activate user. Admin only.
     */
    public function updateUserStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $targetUser = User::find($id);
        if (!$targetUser) {
            return response()->json(['success' => false, 'message' => 'User tidak ditemukan.'], 404);
        }

        $request->validate([
            'status' => 'required|string|in:active,suspended',
        ]);

        $newStatus = strtolower(trim((string) $request->input('status')));
        $targetUser->status = $newStatus;

        // If user is suspended, revoke all active Sanctum tokens and suspend their shop
        if ($newStatus === 'suspended') {
            $targetUser->tokens()->delete();
            if ($targetUser->shop) {
                $targetUser->shop->update(['status' => 'suspended', 'verified' => false]);
            }
        }
        $targetUser->save();

        AdminAction::create([
            'user_id' => $user->id,
            'action' => 'update_user_status',
            'target_type' => 'user',
            'target_id' => $targetUser->id,
            'details_json' => ['new_status' => $newStatus, 'tokens_revoked' => ($newStatus === 'suspended')],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status user berhasil diperbarui.',
            'user' => $targetUser,
        ]);
    }

    /**
     * List sellers with pagination.
     */
    public function sellers(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isAdmin() && !$user->isSupport())) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $perPage = min(50, max(5, (int) $request->input('per_page', 20)));
        $sellers = Shop::with('user')->withCount('products')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $sellers->items(),
            'pagination' => [
                'current_page' => $sellers->currentPage(),
                'last_page' => $sellers->lastPage(),
                'total' => $sellers->total(),
            ],
        ]);
    }

    /**
     * Approve, reject, or suspend a seller. Admin only.
     */
    public function updateSellerStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $shop = Shop::find($id);
        if (!$shop) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan.'], 404);
        }

        $request->validate([
            'status' => 'required|string|in:approved,rejected,suspended,pending',
        ]);

        $status = strtolower(trim((string) $request->input('status')));
        $shop->status = $status;
        $shop->verified = ($status === 'approved');
        $shop->save();

        // Synchronize owner role and active tokens based on lifecycle transition
        if ($status === 'approved') {
            if ($shop->user && !$shop->user->isAdmin()) {
                $shop->user->update(['role' => 'seller']);
            }
        } elseif (in_array($status, ['rejected', 'suspended'], true)) {
            if ($shop->user && !$shop->user->isAdmin()) {
                $shop->user->update(['role' => 'customer']);
                if ($status === 'suspended') {
                    $shop->user->tokens()->delete();
                }
            }
        }

        AdminAction::create([
            'user_id' => $user->id,
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
     * Review moderation (hide/approve). Admin or Support.
     */
    public function moderateReview(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isAdmin() && !$user->isSupport())) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $review = Review::find($id);
        if (!$review) {
            return response()->json(['success' => false, 'message' => 'Ulasan tidak ditemukan.'], 404);
        }

        $request->validate([
            'status' => 'required|string|in:approved,hidden,flagged',
        ]);

        $status = $request->input('status');
        $review->status = $status;
        $review->save();

        // Recalculate product rating
        if ($review->product) {
            $approvedReviews = Review::where('product_id', $review->product_id)->where('status', 'approved')->get();
            $reviewCount = count($approvedReviews);
            $avg = $reviewCount > 0 ? round($approvedReviews->avg('rating'), 1) : 5.0;
            $review->product->rating = $avg;
            $review->product->review_count = $reviewCount;
            $review->product->save();
        }

        AdminAction::create([
            'user_id' => $user->id,
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
     * List audit logs with pagination. Admin only.
     */
    public function auditLogs(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $perPage = min(50, max(5, (int) $request->input('per_page', 20)));
        $logs = AdminAction::with('user')->orderBy('id', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * List platform reports. Admin or Support.
     */
    public function reports(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isAdmin() && !$user->isSupport())) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $reports = Report::with('reporter')->orderBy('id', 'desc')->paginate(20);
        return response()->json([
            'success' => true,
            'data' => $reports->items(),
            'pagination' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'total' => $reports->total(),
            ],
        ]);
    }
}
