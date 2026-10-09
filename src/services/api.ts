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
  DeliveryShipment,
  OrderCalculationRequest,
  OrderCalculationResult,
  CheckoutOrderInput,
  CheckoutOrderResult,
  SellerDashboardResult,
  SellerFinancesResult,
  SellerInventoryItem,
  AdminDashboardResult,
  AuditLogItem,
} from '../types';

const TOKEN_KEY = 'pasaria_token';

/**
 * Structured API Error representing HTTP status codes, validation maps, and error descriptions.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly errors?: Record<string, string[]>;
  public readonly code?: string;
  public readonly isNetworkError: boolean;
  public readonly isUnauthorized: boolean;
  public readonly isForbidden: boolean;
  public readonly isNotFound: boolean;
  public readonly isValidationError: boolean;
  public readonly isServerError: boolean;

  constructor(
    message: string,
    status: number = 0,
    errors?: Record<string, string[]>,
    code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.code = code;
    this.isNetworkError = status === 0;
    this.isUnauthorized = status === 401;
    this.isForbidden = status === 403;
    this.isNotFound = status === 404;
    this.isValidationError = status === 422;
    this.isServerError = status >= 500;
  }

  /**
   * Helper to retrieve the first validation message across any field.
   */
  public getFirstValidationError(): string | null {
    if (!this.errors) return null;
    const values = Object.values(this.errors).flat();
    return values.length > 0 ? values[0] : null;
  }
}

type UnauthorizedListener = () => void;
const unauthorizedListeners: Set<UnauthorizedListener> = new Set();

/**
 * Centralized HTTP request dispatcher for Pasaria API.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers,
    });
  } catch (networkErr: any) {
    throw new ApiError(
      'Koneksi ke server terputus. Silakan periksa jaringan internet Anda.',
      0
    );
  }

  // Handle empty 204 response
  if (res.status === 204) {
    return {} as T;
  }

  // Parse response body (robust against non-JSON server errors)
  const contentType = res.headers.get('content-type') || '';
  let json: any = null;
  let text = '';

  if (contentType.includes('application/json')) {
    try {
      json = await res.json();
    } catch {
      json = null;
    }
  } else {
    try {
      text = await res.text();
    } catch {
      text = '';
    }
  }

  // Handle HTTP error responses
  if (!res.ok) {
    // 401 Unauthorized: clear expired credentials and notify listeners
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      unauthorizedListeners.forEach((listener) => {
        try {
          listener();
        } catch {}
      });
    }

    const message =
      json?.message ||
      json?.error ||
      json?.sql_error ||
      (text ? text.slice(0, 160) : `Permintaan gagal dengan status ${res.status}.`);

    throw new ApiError(message, res.status, json?.errors, json?.code);
  }

  // Business error envelope verification (e.g. { success: false })
  if (json && typeof json === 'object' && json.success === false) {
    throw new ApiError(
      json.message || json.sql_error || 'Operasi gagal diproses oleh server.',
      res.status,
      json.errors
    );
  }

  return (json !== null ? json : text) as T;
}

export const api = {
  // ── Authentication & Token State ──────────────────────────────────────────
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

  onUnauthorized(listener: UnauthorizedListener): () => void {
    unauthorizedListeners.add(listener);
    return () => unauthorizedListeners.delete(listener);
  },

  // ── 1. Categories ─────────────────────────────────────────────────────────
  async getCategories(): Promise<Category[]> {
    const json = await request<{ success: boolean; data: Category[] }>('/api/categories');
    return json.data || [];
  },

  // ── 2. Products ───────────────────────────────────────────────────────────
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

    const qs = query.toString();
    const json = await request<{ data: Product[]; sqli_mode?: boolean; sql_error?: string }>(
      qs ? `/api/products?${qs}` : '/api/products'
    );

    return {
      products: json.data || [],
      sqli_mode: json.sqli_mode,
      sql_error: json.sql_error,
    };
  },

  async getProductBySlug(slug: string): Promise<{ product: Product; related: Product[] }> {
    const json = await request<{ success: boolean; data: Product; related?: Product[] }>(
      `/api/products/${encodeURIComponent(slug)}`
    );
    return {
      product: json.data,
      related: json.related || [],
    };
  },

  async addProduct(productData: Partial<Product> | Record<string, any>): Promise<{ success: boolean; product: Product }> {
    return request<{ success: boolean; product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  async createSellerProduct(productData: Partial<Product> | Record<string, any>): Promise<{ success: boolean; product: Product }> {
    return this.addProduct(productData);
  },

  async deleteProduct(productId: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/products/${productId}`, {
      method: 'DELETE',
    });
  },

  async updateProduct(productId: number, productData: Partial<Product> | Record<string, any>): Promise<{ success: boolean; product: Product; message: string }> {
    return request<{ success: boolean; product: Product; message: string }>(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  async toggleProductStatus(productId: number, isActive?: boolean): Promise<{ success: boolean; is_active: boolean; message: string }> {
    return request<{ success: boolean; is_active: boolean; message: string }>(`/api/products/${productId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(isActive !== undefined ? { is_active: isActive } : {}),
    });
  },

  async uploadImage(file: File): Promise<{ success: boolean; url: string; path: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ success: boolean; url: string; path: string; filename: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async deleteUploadedImage(path: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/upload', {
      method: 'DELETE',
      body: JSON.stringify({ path }),
    });
  },

  // ── 3. Authentication ─────────────────────────────────────────────────────
  async login(username: string, password: string): Promise<{ user: User; token: string; sqli_mode?: boolean }> {
    const json = await request<{ success: boolean; user: User; token: string; sqli_mode?: boolean }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );

    if (json.token) {
      this.setToken(json.token);
    }
    return { user: json.user, token: json.token, sqli_mode: json.sqli_mode };
  },

  async register(data: { name: string; username: string; email: string; password: string }): Promise<{ user: User; token: string }> {
    const json = await request<{ success: boolean; user: User; token: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (json.token) {
      this.setToken(json.token);
    }
    return { user: json.user, token: json.token };
  },

  async logout(): Promise<void> {
    try {
      if (this.getToken()) {
        await request('/api/auth/logout', { method: 'POST' });
      }
    } catch {
      // Ignore server error on logout to always clean local state
    } finally {
      this.clearToken();
    }
  },

  async verifyEmail(code: string, email?: string): Promise<{ success: boolean; message: string; user?: User }> {
    return request<{ success: boolean; message: string; user?: User }>(
      '/api/auth/verify-email',
      {
        method: 'POST',
        body: JSON.stringify({ code, email }),
      }
    );
  },

  async resendVerification(email?: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(
      '/api/auth/resend-verification',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  },

  async getMe(): Promise<User | null> {
    if (!this.getToken()) return null;
    try {
      const json = await request<{ success: boolean; user: User }>('/api/auth/me');
      return json.user || null;
    } catch (e: any) {
      if (e instanceof ApiError && e.isUnauthorized) {
        return null;
      }
      throw e;
    }
  },

  async updateProfile(userData: Partial<User>): Promise<{ success: boolean; user: User }> {
    return request<{ success: boolean; user: User }>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async changePassword(
    arg1: string | { current_password: string; new_password: string; new_password_confirmation?: string },
    newPassword?: string
  ): Promise<{ success: boolean }> {
    const body =
      typeof arg1 === 'object'
        ? arg1
        : { current_password: arg1, new_password: newPassword, new_password_confirmation: newPassword };

    return request<{ success: boolean }>('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  // ── 4. Addresses ──────────────────────────────────────────────────────────
  async getAddresses(): Promise<UserAddress[]> {
    const json = await request<{ success: boolean; data: UserAddress[] }>('/api/user/addresses');
    return json.data || [];
  },

  async addAddress(addressData: Partial<UserAddress>): Promise<UserAddress> {
    const json = await request<{ success: boolean; data: UserAddress }>('/api/user/addresses', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
    return json.data;
  },

  async updateAddress(id: number, addressData: Partial<UserAddress>): Promise<UserAddress> {
    const json = await request<{ success: boolean; data: UserAddress }>(`/api/user/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
    return json.data;
  },

  async deleteAddress(id: number): Promise<boolean> {
    const json = await request<{ success: boolean }>(`/api/user/addresses/${id}`, {
      method: 'DELETE',
    });
    return !!json.success;
  },

  async setDefaultAddress(id: number): Promise<UserAddress> {
    const json = await request<{ success: boolean; data: UserAddress }>(
      `/api/user/addresses/${id}/default`,
      { method: 'POST' }
    );
    return json.data;
  },

  // ── 5. Cart (Session & User Context Resolved Server-Side) ───────────────────
  async getCart(_ignoredLegacyUserId?: number): Promise<any[]> {
    const json = await request<{ success: boolean; data: any[] }>('/api/cart');
    return json.data || [];
  },

  async syncCart(itemsOrUserId: any, maybeItems?: any[]): Promise<boolean> {
    // Support legacy signature syncCart(userId, items) and new syncCart(items)
    const items = Array.isArray(itemsOrUserId) ? itemsOrUserId : (maybeItems || []);
    const json = await request<{ success: boolean }>('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    return !!json.success;
  },

  async clearCart(_ignoredLegacyUserId?: number): Promise<boolean> {
    const json = await request<{ success: boolean }>('/api/cart', {
      method: 'DELETE',
    });
    return !!json.success;
  },

  // ── 6. Orders & Checkout ──────────────────────────────────────────────────
  async calculateOrder(data: OrderCalculationRequest | any): Promise<OrderCalculationResult> {
    const body = Array.isArray(data) ? { items: data } : data;
    const json = await request<{ success: boolean; data: OrderCalculationResult }>(
      '/api/orders/calculate',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
    return json.data;
  },

  async createOrder(orderData: CheckoutOrderInput | any): Promise<CheckoutOrderResult> {
    return request<CheckoutOrderResult>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async checkoutOrder(orderData: CheckoutOrderInput | any): Promise<CheckoutOrderResult> {
    return this.createOrder(orderData);
  },

  async getOrders(statusOrLegacyUserId?: string | number, legacyStatus?: string): Promise<Order[]> {
    const query = new URLSearchParams();
    let statusFilter: string | undefined;

    if (typeof statusOrLegacyUserId === 'string' && statusOrLegacyUserId !== 'all') {
      statusFilter = statusOrLegacyUserId;
    } else if (legacyStatus && legacyStatus !== 'all') {
      statusFilter = legacyStatus;
    }

    if (statusFilter) {
      query.set('status', statusFilter);
    }

    const qs = query.toString();
    const json = await request<{ success: boolean; data: Order[] }>(
      qs ? `/api/orders?${qs}` : '/api/orders'
    );
    return json.data || [];
  },

  async getOrder(orderNumber: string): Promise<Order> {
    const json = await request<{ success: boolean; data: Order }>(
      `/api/orders/${encodeURIComponent(orderNumber)}`
    );
    return json.data;
  },

  async cancelOrder(id: number, reason?: string): Promise<boolean> {
    const json = await request<{ success: boolean }>(`/api/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return !!json.success;
  },

  async updateOrderStatus(
    orderId: number,
    status: string,
    trackingNumber?: string,
    courier?: string
  ): Promise<Order> {
    const json = await request<{ success: boolean; data: Order }>(
      `/api/orders/${orderId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          status,
          tracking_number: trackingNumber,
          courier,
        }),
      }
    );
    return json.data;
  },

  // ── 7. Deliveries ─────────────────────────────────────────────────────────
  async getDeliveries(_ignoredLegacyUserId?: number): Promise<DeliveryShipment[]> {
    const json = await request<{ success: boolean; data: DeliveryShipment[] }>('/api/deliveries');
    return json.data || [];
  },

  async getDeliveryByCode(code: string): Promise<DeliveryShipment | null> {
    try {
      const json = await request<{ success: boolean; data: DeliveryShipment }>(
        `/api/deliveries/${encodeURIComponent(code)}`
      );
      return json.data || null;
    } catch (e: any) {
      if (e instanceof ApiError && e.isNotFound) return null;
      throw e;
    }
  },

  async saveDelivery(shipment: any): Promise<DeliveryShipment> {
    const json = await request<{ success: boolean; data: DeliveryShipment }>('/api/deliveries', {
      method: 'POST',
      body: JSON.stringify(shipment),
    });
    return json.data || shipment;
  },

  // ── 8. Reviews ────────────────────────────────────────────────────────────
  async getProductReviews(productId: number): Promise<{ reviews: Review[]; breakdown: any }> {
    const json = await request<{
      success: boolean;
      data: Review[];
      summary?: { breakdown: any };
      breakdown?: any;
    }>(`/api/products/${productId}/reviews`);

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
    const json = await request<{ success: boolean; data: Review }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return json.data;
  },

  async replyReview(reviewId: number, reply: string): Promise<Review> {
    const json = await request<{ success: boolean; data: Review }>(`/api/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    });
    return json.data;
  },

  // ── 9. Questions & Answers ────────────────────────────────────────────────
  async getProductQuestions(productId: number): Promise<ProductQuestion[]> {
    const json = await request<{ success: boolean; data: ProductQuestion[] }>(
      `/api/products/${productId}/questions`
    );
    return json.data || [];
  },

  async askQuestion(productId: number, question: string): Promise<ProductQuestion> {
    const json = await request<{ success: boolean; data: ProductQuestion }>('/api/questions', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, question }),
    });
    return json.data;
  },

  async answerQuestion(questionId: number, answer: string): Promise<any> {
    const json = await request<{ success: boolean; data: any }>(
      `/api/questions/${questionId}/answer`,
      {
        method: 'POST',
        body: JSON.stringify({ answer }),
      }
    );
    return json.data;
  },

  // ── 10. Wishlist ──────────────────────────────────────────────────────────
  async getWishlist(): Promise<Product[]> {
    const json = await request<{ success: boolean; data: Product[] }>('/api/wishlist');
    return json.data || [];
  },

  async addToWishlist(productId: number): Promise<boolean> {
    const json = await request<{ success: boolean }>('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
    return !!json.success;
  },

  async removeFromWishlist(productId: number): Promise<boolean> {
    const json = await request<{ success: boolean }>(`/api/wishlist/${productId}`, {
      method: 'DELETE',
    });
    return !!json.success;
  },

  // ── 11. Shops & Following ─────────────────────────────────────────────────
  async getShop(slugOrId: string | number): Promise<Shop> {
    const json = await request<{ success: boolean; data: Shop }>(`/api/shops/${slugOrId}`);
    return json.data;
  },

  async createShop(shopData: Partial<Shop>): Promise<Shop> {
    const json = await request<{ success: boolean; shop?: Shop; data?: Shop }>('/api/shops', {
      method: 'POST',
      body: JSON.stringify(shopData),
    });
    return json.shop || json.data!;
  },

  async updateShop(shopId: number, shopData: Partial<Shop>): Promise<Shop> {
    const json = await request<{ success: boolean; data: Shop }>(`/api/shops/${shopId}`, {
      method: 'PUT',
      body: JSON.stringify(shopData),
    });
    return json.data;
  },

  async followShop(shopId: number): Promise<boolean> {
    const json = await request<{ success: boolean }>(`/api/shops/${shopId}/follow`, {
      method: 'POST',
    });
    return !!json.success;
  },

  async unfollowShop(shopId: number): Promise<boolean> {
    const json = await request<{ success: boolean }>(`/api/shops/${shopId}/follow`, {
      method: 'DELETE',
    });
    return !!json.success;
  },

  async getFollowingShops(): Promise<Shop[]> {
    const json = await request<{ success: boolean; data: Shop[] }>('/api/shops/following');
    return json.data || [];
  },

  // ── 12. Vouchers ──────────────────────────────────────────────────────────
  async getVouchers(): Promise<Voucher[]> {
    const json = await request<{ success: boolean; data: Voucher[] }>('/api/vouchers');
    return json.data || [];
  },

  async validateVoucher(code: string, subtotal: number, shippingCost: number = 15000): Promise<any> {
    const json = await request<{ success: boolean; data: any }>('/api/vouchers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal, shipping_cost: shippingCost }),
    });
    return json.data;
  },

  // ── 13. Chat ──────────────────────────────────────────────────────────────
  async getConversations(): Promise<Conversation[]> {
    const json = await request<{ success: boolean; data: Conversation[] }>('/api/conversations');
    return json.data || [];
  },

  async getMessages(conversationId: number): Promise<Message[]> {
    const json = await request<{ success: boolean; data: Message[] }>(
      `/api/conversations/${conversationId}/messages`
    );
    return json.data || [];
  },

  async sendMessage(
    conversationId: number,
    message: string,
    attachmentUrl?: string
  ): Promise<Message> {
    const json = await request<{ success: boolean; data: Message }>(
      '/api/conversations/messages',
      {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: conversationId,
          message,
          attachment_url: attachmentUrl,
        }),
      }
    );
    return json.data;
  },

  async startConversation(shopId: number): Promise<Conversation> {
    const json = await request<{ success: boolean; data: Conversation }>(
      '/api/conversations/start',
      {
        method: 'POST',
        body: JSON.stringify({ shop_id: shopId }),
      }
    );
    return json.data;
  },

  // ── 14. Returns & Disputes ────────────────────────────────────────────────
  async getReturns(): Promise<OrderReturn[]> {
    const json = await request<{ success: boolean; data: OrderReturn[] }>('/api/returns');
    return json.data || [];
  },

  async createReturn(data: {
    order_id: number;
    shop_id?: number;
    order_item_id?: number;
    quantity?: number;
    reason: string;
    description: string;
    requested_amount?: number;
    evidence_urls?: string[];
  }): Promise<OrderReturn> {
    const json = await request<{ success: boolean; data: OrderReturn }>('/api/returns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return json.data;
  },

  async requestReturn(data: {
    order_id: number;
    reason: string;
    description: string;
    order_item_id?: number;
    quantity?: number;
    evidence_urls?: string[];
  }): Promise<OrderReturn> {
    return this.createReturn(data);
  },

  async respondReturn(
    returnId: number,
    decision: 'approved' | 'rejected',
    note?: string
  ): Promise<OrderReturn> {
    const json = await request<{ success: boolean; data: OrderReturn }>(
      `/api/returns/${returnId}/respond`,
      {
        method: 'POST',
        body: JSON.stringify({ decision, note }),
      }
    );
    return json.data;
  },

  async openDispute(returnId: number): Promise<Dispute> {
    const json = await request<{ success: boolean; data: Dispute }>(
      `/api/returns/${returnId}/dispute`,
      { method: 'POST' }
    );
    return json.data;
  },

  async resolveDispute(
    disputeId: number,
    resolution: string,
    resolutionNote?: string
  ): Promise<Dispute> {
    const json = await request<{ success: boolean; data: Dispute }>(
      `/api/disputes/${disputeId}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify({ resolution, resolution_note: resolutionNote }),
      }
    );
    return json.data;
  },

  // ── 15. Notifications ─────────────────────────────────────────────────────
  async getNotifications(): Promise<NotificationItem[]> {
    const json = await request<{ success: boolean; data: NotificationItem[] }>('/api/notifications');
    return json.data || [];
  },

  async markNotificationRead(id: number): Promise<void> {
    await request(`/api/notifications/${id}/read`, { method: 'POST' });
  },

  async markNotificationAsRead(id: number): Promise<void> {
    return this.markNotificationRead(id);
  },

  async markAllNotificationsRead(): Promise<void> {
    await request('/api/notifications/read-all', { method: 'POST' });
  },

  async markAllNotificationsAsRead(): Promise<void> {
    return this.markAllNotificationsRead();
  },

  // ── 16. Seller Center ─────────────────────────────────────────────────────
  async getSellerDashboard(): Promise<SellerDashboardResult> {
    const json = await request<{ success: boolean; data: SellerDashboardResult }>(
      '/api/seller/dashboard'
    );
    return json.data || {};
  },

  async getSellerProducts(): Promise<Product[]> {
    const json = await request<{ success: boolean; data: Product[] }>('/api/seller/products');
    return json.data || [];
  },

  async getSellerInventory(): Promise<SellerInventoryItem[]> {
    const json = await request<{
      success: boolean;
      data?: SellerInventoryItem[];
      inventory?: SellerInventoryItem[];
    }>('/api/seller/inventory');
    return json.data || json.inventory || [];
  },

  async getSellerOrders(): Promise<Order[]> {
    const json = await request<{ success: boolean; data: Order[] }>('/api/seller/orders');
    return json.data || [];
  },

  async updateSellerStock(variantId: number, stock: number): Promise<any> {
    const json = await request<{ success: boolean; data: any }>(
      `/api/seller/inventory/${variantId}/stock`,
      {
        method: 'PUT',
        body: JSON.stringify({ stock }),
      }
    );
    return json.data;
  },

  async getSellerFinances(): Promise<SellerFinancesResult> {
    const json = await request<{ success: boolean; data: SellerFinancesResult }>(
      '/api/seller/finances'
    );
    return json.data || {};
  },

  async requestPayout(data: {
    amount: number;
    bank_name: string;
    account_number: string;
    account_holder: string;
  }): Promise<any> {
    const json = await request<{ success: boolean; data: any }>('/api/seller/payout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return json.data;
  },

  async requestSellerPayout(data: {
    amount: number;
    bank_name: string;
    account_number: string;
    account_holder: string;
  }): Promise<any> {
    return this.requestPayout(data);
  },

  // ── 17. Admin Panel ───────────────────────────────────────────────────────
  async getAdminDashboard(): Promise<AdminDashboardResult> {
    const json = await request<{ success: boolean; data: AdminDashboardResult }>(
      '/api/admin/dashboard'
    );
    return json.data || ({} as AdminDashboardResult);
  },

  async getAdminUsers(): Promise<User[]> {
    const json = await request<{ success: boolean; data: User[] }>('/api/admin/users');
    return json.data || [];
  },

  async updateUserStatus(userId: number, status: string): Promise<any> {
    return request(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async toggleUserStatus(userId: number, status: string): Promise<any> {
    return this.updateUserStatus(userId, status);
  },

  async getAdminSellers(): Promise<Shop[]> {
    const json = await request<{ success: boolean; data: Shop[] }>('/api/admin/sellers');
    return json.data || [];
  },

  async updateSellerStatus(shopId: number, status: string): Promise<any> {
    return request(`/api/admin/sellers/${shopId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async approveSeller(shopId: number, status: string): Promise<any> {
    return this.updateSellerStatus(shopId, status);
  },

  async moderateReview(reviewId: number, status: 'approved' | 'hidden' | 'active'): Promise<any> {
    return request(`/api/admin/reviews/${reviewId}/moderate`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async getAuditLogs(): Promise<AuditLogItem[]> {
    const json = await request<{ success: boolean; data: AuditLogItem[] }>('/api/admin/audit-logs');
    return json.data || [];
  },

  async getAdminAuditLogs(): Promise<AuditLogItem[]> {
    return this.getAuditLogs();
  },

  async getAdminReports(): Promise<any[]> {
    const json = await request<{ success: boolean; data: any[] }>('/api/admin/reports');
    return json.data || [];
  },

  // ── 18. Local Educational Demo Mode ───────────────────────────────────────
  async getDemoMode(): Promise<{ demo_sqli_mode: boolean; description: string }> {
    return request<{ demo_sqli_mode: boolean; description: string }>('/api/config/demo-mode');
  },

  async toggleDemoMode(enabled: boolean): Promise<boolean> {
    const json = await request<{ success: boolean; demo_sqli_mode: boolean }>(
      '/api/config/demo-mode',
      {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      }
    );
    return json.demo_sqli_mode;
  },
};
