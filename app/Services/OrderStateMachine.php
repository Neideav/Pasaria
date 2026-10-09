<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use InvalidArgumentException;

class OrderStateMachine
{
    // Canonical Order Lifecycle States
    public const STATUS_PENDING_PAYMENT  = 'pending_payment';
    public const STATUS_PAID             = 'paid';
    public const STATUS_PROCESSING       = 'processing';
    public const STATUS_PACKED           = 'packed';
    public const STATUS_SHIPPED          = 'shipped';
    public const STATUS_DELIVERED        = 'delivered';
    public const STATUS_COMPLETED        = 'completed';
    public const STATUS_CANCELLED        = 'cancelled';
    public const STATUS_RETURN_REQUESTED = 'return_requested';
    public const STATUS_RETURN_APPROVED  = 'return_approved';
    public const STATUS_REFUND_PROCESSING= 'refund_processing';
    public const STATUS_REFUNDED         = 'refunded';
    public const STATUS_DISPUTED         = 'disputed';

    /**
     * Allowed State Transitions Graph
     */
    public const TRANSITIONS = [
        self::STATUS_PENDING_PAYMENT => [
            self::STATUS_PAID,
            self::STATUS_CANCELLED,
        ],
        self::STATUS_PAID => [
            self::STATUS_PROCESSING,
            self::STATUS_CANCELLED,
            self::STATUS_REFUND_PROCESSING,
        ],
        self::STATUS_PROCESSING => [
            self::STATUS_PACKED,
            self::STATUS_SHIPPED,
            self::STATUS_CANCELLED,
            self::STATUS_REFUND_PROCESSING,
        ],
        self::STATUS_PACKED => [
            self::STATUS_SHIPPED,
            self::STATUS_CANCELLED,
        ],
        self::STATUS_SHIPPED => [
            self::STATUS_DELIVERED,
        ],
        self::STATUS_DELIVERED => [
            self::STATUS_COMPLETED,
            self::STATUS_RETURN_REQUESTED,
        ],
        self::STATUS_COMPLETED => [
            self::STATUS_RETURN_REQUESTED,
        ],
        self::STATUS_RETURN_REQUESTED => [
            self::STATUS_RETURN_APPROVED,
            self::STATUS_REFUND_PROCESSING,
            self::STATUS_DISPUTED,
            self::STATUS_COMPLETED, // If return is rejected by seller/admin
        ],
        self::STATUS_RETURN_APPROVED => [
            self::STATUS_REFUND_PROCESSING,
            self::STATUS_REFUNDED,
            self::STATUS_DISPUTED,
        ],
        self::STATUS_REFUND_PROCESSING => [
            self::STATUS_REFUNDED,
            self::STATUS_COMPLETED, // If refund process aborted/failed
        ],
        self::STATUS_DISPUTED => [
            self::STATUS_REFUND_PROCESSING,
            self::STATUS_REFUNDED,
            self::STATUS_COMPLETED,
        ],
        self::STATUS_REFUNDED => [],
        self::STATUS_CANCELLED => [],
    ];

    /**
     * Terminal States that cannot be changed
     */
    public const TERMINAL_STATES = [
        self::STATUS_CANCELLED,
        self::STATUS_REFUNDED,
    ];

    /**
     * Maximum return window duration in days
     */
    public const RETURN_WINDOW_DAYS = 7;

    /**
     * Validate whether transition from $currentStatus to $newStatus is globally permissible.
     */
    public function canTransition(string $currentStatus, string $newStatus, ?string $role = null): bool
    {
        $current = strtolower(trim($currentStatus));
        $next = strtolower(trim($newStatus));

        if ($current === 'pending') $current = self::STATUS_PENDING_PAYMENT;
        if ($next === 'pending') $next = self::STATUS_PENDING_PAYMENT;

        if ($current === $next) {
            return true;
        }

        if (in_array($current, self::TERMINAL_STATES, true)) {
            return false;
        }

        $allowedNext = self::TRANSITIONS[$current] ?? [];
        if (!in_array($next, $allowedNext, true)) {
            return false;
        }

        if ($role !== null) {
            return $this->isRoleAuthorized($current, $next, strtolower($role));
        }

        return true;
    }

    /**
     * Assert transition is valid or throw descriptive exception.
     */
    public function assertCanTransition(string $currentStatus, string $newStatus, ?string $role = null): void
    {
        $current = strtolower(trim($currentStatus));
        $next = strtolower(trim($newStatus));

        if ($current === 'pending') $current = self::STATUS_PENDING_PAYMENT;
        if ($next === 'pending') $next = self::STATUS_PENDING_PAYMENT;

        if (in_array($current, self::TERMINAL_STATES, true)) {
            throw new InvalidArgumentException("Pesanan yang sudah berada pada status final '{$current}' tidak dapat diubah lagi.");
        }

        $allowedNext = self::TRANSITIONS[$current] ?? [];
        if (!in_array($next, $allowedNext, true)) {
            throw new InvalidArgumentException("Transisi status dari '{$current}' ke '{$next}' tidak diizinkan dalam siklus pesanan.");
        }

        if ($role !== null && !$this->isRoleAuthorized($current, $next, strtolower($role))) {
            throw new InvalidArgumentException("Peran '{$role}' tidak memiliki otorisasi untuk mengubah pesanan dari '{$current}' ke '{$next}'.");
        }
    }

    /**
     * Role-specific transition authorization rules.
     */
    public function isRoleAuthorized(string $current, string $next, string $role): bool
    {
        if ($role === 'admin') {
            // Admin can execute any valid transition in graph, except resurrecting terminal states
            return !in_array($current, self::TERMINAL_STATES, true);
        }

        if ($role === 'support') {
            // Support can handle return/dispute/refund workflows
            $supportAllowed = [
                self::STATUS_RETURN_REQUESTED,
                self::STATUS_RETURN_APPROVED,
                self::STATUS_REFUND_PROCESSING,
                self::STATUS_DISPUTED,
            ];
            return in_array($current, $supportAllowed, true);
        }

        if ($role === 'seller') {
            // Seller can fulfill orders: paid -> processing -> packed -> shipped
            // Seller can cancel paid/processing/packed orders if out of stock
            // Seller can respond to return_requested
            $sellerTransitions = [
                self::STATUS_PAID             => [self::STATUS_PROCESSING, self::STATUS_CANCELLED],
                self::STATUS_PROCESSING       => [self::STATUS_PACKED, self::STATUS_SHIPPED, self::STATUS_CANCELLED],
                self::STATUS_PACKED           => [self::STATUS_SHIPPED, self::STATUS_CANCELLED],
                self::STATUS_SHIPPED          => [self::STATUS_DELIVERED],
                self::STATUS_DELIVERED        => [self::STATUS_COMPLETED],
                self::STATUS_RETURN_REQUESTED => [self::STATUS_RETURN_APPROVED, self::STATUS_COMPLETED],
            ];
            return in_array($next, $sellerTransitions[$current] ?? [], true);
        }

        if ($role === 'customer') {
            // Customer can cancel prior to packed/shipped
            // Customer can confirm delivery: delivered -> completed
            // Customer can request return on delivered or completed orders
            $customerTransitions = [
                self::STATUS_PENDING_PAYMENT  => [self::STATUS_CANCELLED],
                self::STATUS_PAID             => [self::STATUS_CANCELLED],
                self::STATUS_PROCESSING       => [self::STATUS_CANCELLED],
                self::STATUS_DELIVERED        => [self::STATUS_COMPLETED, self::STATUS_RETURN_REQUESTED],
                self::STATUS_COMPLETED        => [self::STATUS_RETURN_REQUESTED],
                self::STATUS_RETURN_REQUESTED => [self::STATUS_DISPUTED],
                self::STATUS_RETURN_APPROVED  => [self::STATUS_DISPUTED],
            ];
            return in_array($next, $customerTransitions[$current] ?? [], true);
        }

        return false;
    }

    /**
     * Check if an order is currently eligible for cancellation.
     */
    public function isCancellable(Order $order, ?User $user = null): bool
    {
        $status = strtolower((string) $order->status);
        if ($status === 'pending') $status = self::STATUS_PENDING_PAYMENT;

        if (in_array($status, self::TERMINAL_STATES, true)) {
            return false;
        }

        // Shipped, delivered, and completed orders cannot be cancelled
        if (in_array($status, [self::STATUS_SHIPPED, self::STATUS_DELIVERED, self::STATUS_COMPLETED], true)) {
            return false;
        }

        if (!$user) {
            return in_array($status, [self::STATUS_PENDING_PAYMENT, self::STATUS_PAID, self::STATUS_PROCESSING], true);
        }

        if ($user->isAdmin()) {
            return in_array($status, [self::STATUS_PENDING_PAYMENT, self::STATUS_PAID, self::STATUS_PROCESSING, self::STATUS_PACKED], true);
        }

        if ($user->isSeller()) {
            return ($order->shop_id === $user->shop?->id) && in_array($status, [self::STATUS_PAID, self::STATUS_PROCESSING, self::STATUS_PACKED], true);
        }

        // Customer
        return ($order->user_id === $user->id) && in_array($status, [self::STATUS_PENDING_PAYMENT, self::STATUS_PAID, self::STATUS_PROCESSING], true);
    }

    /**
     * Check if an order is eligible for return submission.
     */
    public function isReturnable(Order $order, ?User $user = null): array
    {
        $status = strtolower((string) $order->status);

        if (!in_array($status, [self::STATUS_DELIVERED, self::STATUS_COMPLETED], true)) {
            return [
                'eligible' => false,
                'message'  => "Pengajuan pengembalian hanya dapat dilakukan untuk pesanan yang telah diterima (delivered atau completed).",
            ];
        }

        if ($user && !$user->isAdmin() && $order->user_id !== $user->id) {
            return [
                'eligible' => false,
                'message'  => "Anda tidak memiliki akses ke pesanan ini.",
            ];
        }

        // Check 7-day return policy window
        $completionDate = $order->updated_at ?: $order->created_at;
        if ($completionDate && Carbon::parse($completionDate)->diffInDays(now()) > self::RETURN_WINDOW_DAYS) {
            return [
                'eligible' => false,
                'message'  => "Batas waktu pengajuan pengembalian (" . self::RETURN_WINDOW_DAYS . " hari sejak pesanan diterima) telah berakhir.",
            ];
        }

        return ['eligible' => true, 'message' => 'Pesanan memenuhi syarat untuk pengajuan retur.'];
    }

    /**
     * Get human-readable status badge and label in Indonesian.
     */
    public static function getStatusLabel(string $status): string
    {
        return match (strtolower(trim($status))) {
            self::STATUS_PENDING_PAYMENT   => 'Menunggu Pembayaran',
            self::STATUS_PAID              => 'Pembayaran Dikonfirmasi',
            self::STATUS_PROCESSING        => 'Diproses Penjual',
            self::STATUS_PACKED            => 'Dikemas & Siap Dikirim',
            self::STATUS_SHIPPED           => 'Sedang Dikirim',
            self::STATUS_DELIVERED         => 'Tiba di Tujuan',
            self::STATUS_COMPLETED         => 'Pesanan Selesai',
            self::STATUS_CANCELLED         => 'Dibatalkan',
            self::STATUS_RETURN_REQUESTED  => 'Pengajuan Retur',
            self::STATUS_RETURN_APPROVED   => 'Retur Disetujui',
            self::STATUS_REFUND_PROCESSING => 'Pengembalian Dana Diproses',
            self::STATUS_REFUNDED          => 'Dana Dikembalikan',
            self::STATUS_DISPUTED          => 'Sengketa Resolusi',
            default                        => ucfirst(str_replace('_', ' ', $status)),
        };
    }
}
