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
use App\Models\SellerPayout;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminApiController extends Controller
{
    protected LedgerService $ledgerService;

    public function __construct(LedgerService $ledgerService)
    {
        $this->ledgerService = $ledgerService;
    }

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

    /**
     * List seller payouts with pagination and filter. Admin only.
     */
    public function payouts(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $query = SellerPayout::with(['shop.user', 'processor'])->orderBy('id', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = min(50, max(5, (int) $request->input('per_page', 20)));
        $payouts = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $payouts->items(),
            'pagination' => [
                'current_page' => $payouts->currentPage(),
                'last_page' => $payouts->lastPage(),
                'per_page' => $payouts->perPage(),
                'total' => $payouts->total(),
            ],
        ]);
    }

    /**
     * Approve payout request and finalize debit. Admin only.
     */
    public function approvePayout(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $payout = SellerPayout::find($id);
        if (!$payout) {
            return response()->json(['success' => false, 'message' => 'Permintaan penarikan dana tidak ditemukan.'], 404);
        }

        // Authorization check: Seller cannot approve their own payout even if they have an admin account!
        if ($payout->shop && $payout->shop->user_id === $user->id) {
            return response()->json(['success' => false, 'message' => 'Penjual tidak diperbolehkan menyetujui pengajuan penarikan dana miliknya sendiri.'], 403);
        }

        try {
            $this->ledgerService->finalizePayout($payout, $user);

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan penarikan dana berhasil disetujui dan dicairkan.',
                'data' => $payout->fresh(['shop', 'processor']),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Reject payout request and release reservation. Admin only.
     */
    public function rejectPayout(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $payout = SellerPayout::find($id);
        if (!$payout) {
            return response()->json(['success' => false, 'message' => 'Permintaan penarikan dana tidak ditemukan.'], 404);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $this->ledgerService->rejectPayout($payout, $user, (string) $request->input('reason'));

            return response()->json([
                'success' => true,
                'message' => 'Pengajuan penarikan dana ditolak dan reservasi saldo telah dikembalikan.',
                'data' => $payout->fresh(['shop', 'processor']),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * List customer refunds with pagination and filters. Admin only.
     */
    public function refunds(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $query = \App\Models\Refund::with(['order', 'shop', 'user', 'processor'])->orderBy('id', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = min(50, max(5, (int) $request->input('per_page', 20)));
        $refunds = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $refunds->items(),
            'pagination' => [
                'current_page' => $refunds->currentPage(),
                'last_page' => $refunds->lastPage(),
                'per_page' => $refunds->perPage(),
                'total' => $refunds->total(),
            ],
        ]);
    }
}
