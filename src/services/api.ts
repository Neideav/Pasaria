import {
  Product,
  Category,
  User,
  Order,
  Shop,
  Review,
  ProductQuestion,
  Voucher,
  Conversation,
  Message,
  OrderReturn,
  Dispute,
  NotificationItem,
  UserAddress,
} from '../types';

const TOKEN_KEY = 'pasaria_token';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // 1. Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  // 2. Products
  async getProducts(params?: {
    q?: string;
    category?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    shop_id?: number;
  }): Promise<{ products: Product[]; sqli_mode?: boolean; sql_error?: string }> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.category) query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
    if (params?.minRating !== undefined) query.set('minRating', String(params.minRating));
    if (params?.shop_id !== undefined) query.set('shop_id', String(params.shop_id));

    const res = await fetch(`/api/products?${query.toString()}`, { headers: getAuthHeaders() });
    const json = await res.json();
    return {
      products: json.data || [],
      sqli_mode: json.sqli_mode,
      sql_error: json.sql_error,
    };
  },

  async getProductBySlug(slug: string): Promise<{ product: Product; related: Product[] }> {
    const res = await fetch(`/api/products/${slug}`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Produk tidak ditemukan');
    return {
      product: json.data,
      related: json.related || [],
    };
  },

  async addProduct(productData: any): Promise<{ success: boolean; product: Product }> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal menambahkan produk');
    return json;
  },

  async createSellerProduct(productData: any): Promise<{ success: boolean; product: Product }> {
    return this.addProduct(productData);
  },

  async deleteProduct(productId: number): Promise<{ success: boolean }> {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json;
  },

  // 3. Auth
  async login(username: string, password: string): Promise<{ user: User; token: string; sqli_mode?: boolean }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || json.sql_error || 'Gagal masuk');
    }
    if (json.token) {
      this.setToken(json.token);
    }
    return { user: json.user, token: json.token, sqli_mode: json.sqli_mode };
  },

  async register(data: { name: string; username: string; email: string; password: string }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Gagal mendaftar');
    }
    if (json.token) {
      this.setToken(json.token);
    }
    return { user: json.user, token: json.token };
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } finally {
      this.clearToken();
    }
  },

  async verifyEmail(code: string, email?: string): Promise<{ success: boolean; message: string; user?: User }> {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, email }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Gagal memverifikasi email');
    }
    return json;
  },

  async resendVerification(email?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Gagal mengirim ulang kode verifikasi');
    }
    return json;
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await fetch('/api/auth/me', { headers: getAuthHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.user || null;
    } catch {
      return null;
    }
  },

  async updateProfile(userData: Partial<User>): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal memperbarui profil');
    return json;
  },

  async changePassword(
    arg1: string | { current_password: string; new_password: string; new_password_confirmation?: string },
    newPassword?: string
  ): Promise<{ success: boolean }> {
    const body = typeof arg1 === 'object'
      ? arg1
      : { current_password: arg1, new_password: newPassword, new_password_confirmation: newPassword };

    const res = await fetch('/api/user/password', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal mengganti kata sandi');
    return json;
  },

  // 4. Addresses
  async getAddresses(): Promise<UserAddress[]> {
    const res = await fetch('/api/user/addresses', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async addAddress(addressData: Partial<UserAddress>): Promise<UserAddress> {
    const res = await fetch('/api/user/addresses', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(addressData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal menambahkan alamat');
    return json.data;
  },

  async updateAddress(id: number, addressData: Partial<UserAddress>): Promise<UserAddress> {
    const res = await fetch(`/api/user/addresses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(addressData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal memperbarui alamat');
    return json.data;
  },

  async deleteAddress(id: number): Promise<boolean> {
    const res = await fetch(`/api/user/addresses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return !!json.success;
  },

  async setDefaultAddress(id: number): Promise<UserAddress> {
    const res = await fetch(`/api/user/addresses/${id}/default`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return json.data;
  },

  // 5. Cart
  async getCart(userId?: number): Promise<any[]> {
    try {
      const url = userId ? `/api/cart?user_id=${userId}` : '/api/cart';
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async syncCart(userId: number, items: any[]): Promise<boolean> {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: userId, items }),
      });
      const json = await res.json();
      return !!json.success;
    } catch {
      return false;
    }
  },

  async clearCart(userId?: number): Promise<boolean> {
    try {
      const url = userId ? `/api/cart?user_id=${userId}` : '/api/cart';
      const res = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() });
      const json = await res.json();
      return !!json.success;
    } catch {
      return false;
    }
  },

  // 6. Orders & Checkout
  async calculateOrder(data: any): Promise<any> {
    const body = Array.isArray(data) ? { items: data } : data;
    const res = await fetch('/api/orders/calculate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal menghitung pesanan');
    return json.data;
  },

  async createOrder(orderData: any): Promise<any> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal membuat pesanan');
    return json;
  },

  async checkoutOrder(orderData: any): Promise<any> {
    return this.createOrder(orderData);
  },

  async getOrders(userId?: number, status?: string): Promise<Order[]> {
    const query = new URLSearchParams();
    if (userId) query.set('user_id', String(userId));
    if (status && status !== 'all') query.set('status', status);

    const res = await fetch(`/api/orders?${query.toString()}`, { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async getOrder(orderNumber: string): Promise<Order> {
    const res = await fetch(`/api/orders/${orderNumber}`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Pesanan tidak ditemukan');
    return json.data;
  },

  async cancelOrder(id: number, reason?: string): Promise<boolean> {
    const res = await fetch(`/api/orders/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal membatalkan pesanan');
    return true;
  },

  async updateOrderStatus(orderId: number, status: string, trackingNumber?: string, courier?: string): Promise<any> {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        status,
        tracking_number: trackingNumber,
        courier,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal memperbarui status pesanan');
    return json.data;
  },

  // 7. Deliveries
  async getDeliveries(userId?: number): Promise<any[]> {
    try {
      const url = userId ? `/api/deliveries?user_id=${userId}` : '/api/deliveries';
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async getDeliveryByCode(code: string): Promise<any> {
    try {
      const res = await fetch(`/api/deliveries/${code}`, { headers: getAuthHeaders() });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch {
      return null;
    }
  },

  async saveDelivery(shipment: any): Promise<any> {
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(shipment),
      });
      const json = await res.json();
      return json.data || shipment;
    } catch {
      return shipment;
    }
  },

  // 8. Reviews
  async getProductReviews(productId: number): Promise<{ reviews: Review[]; breakdown: any }> {
    const res = await fetch(`/api/products/${productId}/reviews`, { headers: getAuthHeaders() });
    const json = await res.json();
    return {
      reviews: json.data || [],
      breakdown: json.summary?.breakdown || json.breakdown || null,
    };
  },

  async createReview(data: {
    product_id: number;
    rating: number;
    review_text: string;
    order_id?: number;
    order_item_id?: number;
    is_anonymous?: boolean;
    media_urls?: string[];
  }): Promise<Review> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal mengirim ulasan');
    return json.data;
  },

  async replyReview(reviewId: number, reply: string): Promise<Review> {
    const res = await fetch(`/api/reviews/${reviewId}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reply }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal membalas ulasan');
    return json.data;
  },

  // 9. Questions & Answers
  async getProductQuestions(productId: number): Promise<ProductQuestion[]> {
    const res = await fetch(`/api/products/${productId}/questions`, { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async askQuestion(productId: number, question: string): Promise<ProductQuestion> {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ product_id: productId, question }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal mengajukan pertanyaan');
    return json.data;
  },

  async answerQuestion(questionId: number, answer: string): Promise<any> {
    const res = await fetch(`/api/questions/${questionId}/answer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ answer }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal menjawab pertanyaan');
    return json.data;
  },

  // 10. Wishlist
  async getWishlist(): Promise<Product[]> {
    try {
      const res = await fetch('/api/wishlist', { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async addToWishlist(productId: number): Promise<boolean> {
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ product_id: productId }),
    });
    const json = await res.json();
    return !!json.success;
  },

  async removeFromWishlist(productId: number): Promise<boolean> {
    const res = await fetch(`/api/wishlist/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return !!json.success;
  },

  // 11. Shops & Following
  async getShop(slugOrId: string | number): Promise<Shop> {
    const res = await fetch(`/api/shops/${slugOrId}`, { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Toko tidak ditemukan');
    return json.data;
  },

  async createShop(shopData: Partial<Shop>): Promise<Shop> {
    const res = await fetch('/api/shops', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(shopData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal membuat toko');
    return json.shop || json.data;
  },

  async updateShop(shopId: number, shopData: Partial<Shop>): Promise<Shop> {
    const res = await fetch(`/api/shops/${shopId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(shopData),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal memperbarui toko');
    return json.data;
  },

  async followShop(shopId: number): Promise<boolean> {
    const res = await fetch(`/api/shops/${shopId}/follow`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return !!json.success;
  },

  async unfollowShop(shopId: number): Promise<boolean> {
    const res = await fetch(`/api/shops/${shopId}/follow`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    return !!json.success;
  },

  async getFollowingShops(): Promise<Shop[]> {
    try {
      const res = await fetch('/api/shops/following', { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  // 12. Vouchers
  async getVouchers(): Promise<Voucher[]> {
    const res = await fetch('/api/vouchers', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async validateVoucher(code: string, subtotal: number, shippingCost: number = 15000): Promise<any> {
    const res = await fetch('/api/vouchers/validate', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, subtotal, shipping_cost: shippingCost }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Voucher tidak valid');
    return json.data;
  },

  // 13. Chat
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch('/api/conversations', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async getMessages(conversationId: number): Promise<Message[]> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async sendMessage(conversationId: number, message: string, attachmentUrl?: string): Promise<Message> {
    const res = await fetch('/api/conversations/messages', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ conversation_id: conversationId, message, attachment_url: attachmentUrl }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal mengirim pesan');
    return json.data;
  },

  async startConversation(shopId: number): Promise<Conversation> {
    const res = await fetch('/api/conversations/start', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ shop_id: shopId }),
    });
    const json = await res.json();
    return json.data;
  },

  // 14. Returns & Disputes
  async getReturns(): Promise<OrderReturn[]> {
    const res = await fetch('/api/returns', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async createReturn(data: { order_id: number; shop_id?: number; reason: string; description: string; requested_amount?: number; evidence_urls?: string[] }): Promise<OrderReturn> {
    const res = await fetch('/api/returns', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal mengajukan retur');
    return json.data;
  },

  async requestReturn(data: { order_id: number; reason: string; description: string; evidence_urls?: string[] }): Promise<OrderReturn> {
    return this.createReturn(data);
  },

  async respondReturn(returnId: number, decision: 'approved' | 'rejected', note?: string): Promise<OrderReturn> {
    const res = await fetch(`/api/returns/${returnId}/respond`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ decision, note }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal merespon retur');
    return json.data;
  },

  async openDispute(returnId: number): Promise<Dispute> {
    const res = await fetch(`/api/returns/${returnId}/dispute`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal membuka sengketa');
    return json.data;
  },

  async resolveDispute(disputeId: number, resolution: string, resolutionNote?: string): Promise<Dispute> {
    const res = await fetch(`/api/disputes/${disputeId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolution, resolution_note: resolutionNote }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal menyelesaikan sengketa');
    return json.data;
  },

  // 15. Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await fetch('/api/notifications', { headers: getAuthHeaders() });
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async markNotificationRead(id: number): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  async markNotificationAsRead(id: number): Promise<void> {
    return this.markNotificationRead(id);
  },

  async markAllNotificationsRead(): Promise<void> {
    await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },

  async markAllNotificationsAsRead(): Promise<void> {
    return this.markAllNotificationsRead();
  },

  // 16. Seller Center
  async getSellerDashboard(): Promise<any> {
    const res = await fetch('/api/seller/dashboard', { headers: getAuthHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal memuat dashboard penjual');
    return json.data;
  },

  async getSellerProducts(): Promise<Product[]> {
    const res = await fetch('/api/seller/products', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async getSellerInventory(): Promise<any[]> {
    const res = await fetch('/api/seller/inventory', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || json.inventory || [];
  },

  async getSellerOrders(): Promise<Order[]> {
    const res = await fetch('/api/seller/orders', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async updateSellerStock(variantId: number, stock: number): Promise<any> {
    const res = await fetch(`/api/seller/inventory/${variantId}/stock`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stock }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal memperbarui stok');
    return json.data;
  },

  async getSellerFinances(): Promise<any> {
    const res = await fetch('/api/seller/finances', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || {};
  },

  async requestPayout(data: { amount: number; bank_name: string; account_number: string; account_holder: string }): Promise<any> {
    const res = await fetch('/api/seller/payout', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal mengajukan penarikan');
    return json.data;
  },

  async requestSellerPayout(data: { amount: number; bank_name: string; account_number: string; account_holder: string }): Promise<any> {
    return this.requestPayout(data);
  },

  // 17. Admin Panel
  async getAdminDashboard(): Promise<any> {
    const res = await fetch('/api/admin/dashboard', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || {};
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch('/api/admin/users', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async updateUserStatus(userId: number, status: string): Promise<any> {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async toggleUserStatus(userId: number, status: string): Promise<any> {
    return this.updateUserStatus(userId, status);
  },

  async getAdminSellers(): Promise<Shop[]> {
    const res = await fetch('/api/admin/sellers', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async updateSellerStatus(shopId: number, status: string): Promise<any> {
    const res = await fetch(`/api/admin/sellers/${shopId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async approveSeller(shopId: number, status: string): Promise<any> {
    return this.updateSellerStatus(shopId, status);
  },

  async moderateReview(reviewId: number, status: 'approved' | 'hidden' | 'active'): Promise<any> {
    const res = await fetch(`/api/admin/reviews/${reviewId}/moderate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async getAuditLogs(): Promise<any[]> {
    const res = await fetch('/api/admin/audit-logs', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  async getAdminAuditLogs(): Promise<any[]> {
    return this.getAuditLogs();
  },

  async getAdminReports(): Promise<any[]> {
    const res = await fetch('/api/admin/reports', { headers: getAuthHeaders() });
    const json = await res.json();
    return json.data || [];
  },

  // 18. Local Educational Demo Mode
  async getDemoMode(): Promise<{ demo_sqli_mode: boolean; description: string }> {
    const res = await fetch('/api/config/demo-mode');
    return res.json();
  },

  async toggleDemoMode(enabled: boolean): Promise<boolean> {
    const res = await fetch('/api/config/demo-mode', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enabled }),
    });
    const json = await res.json();
    return json.demo_sqli_mode;
  },
};
