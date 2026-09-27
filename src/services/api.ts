import { Product, Category, User, Order } from '../types';

export const api = {
  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/categories');
    const json = await res.json();
    return json.data || [];
  },

  async getProducts(params?: {
    q?: string;
    category?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }): Promise<{ products: Product[]; sqli_mode?: boolean; sql_error?: string }> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.category) query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.minPrice) query.set('minPrice', String(params.minPrice));
    if (params?.maxPrice) query.set('maxPrice', String(params.maxPrice));
    if (params?.minRating) query.set('minRating', String(params.minRating));

    const res = await fetch(`/api/products?${query.toString()}`);
    const json = await res.json();
    return {
      products: json.data || [],
      sqli_mode: json.sqli_mode,
      sql_error: json.sql_error
    };
  },

  async getProductBySlug(slug: string): Promise<{ product: Product; related: Product[] }> {
    const res = await fetch(`/api/products/${slug}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Product not found');
    return {
      product: json.data,
      related: json.related || []
    };
  },

  async login(username: string, password: string): Promise<{ user: User; sqli_mode?: boolean }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || json.sql_error || 'Login failed');
    }
    return { user: json.user, sqli_mode: json.sqli_mode };
  },

  async register(data: { name: string; username: string; email: string; password: string }): Promise<User> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.message || 'Registration failed');
    }
    return json.user;
  },

  async createOrder(orderData: any): Promise<{ order_number: string; transaction_id: string }> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Failed to place order');
    return {
      order_number: json.order_number,
      transaction_id: json.transaction_id
    };
  },

  async getOrders(): Promise<Order[]> {
    const res = await fetch('/api/orders');
    const json = await res.json();
    return json.data || [];
  },

  async getDemoMode(): Promise<{ demo_sqli_mode: boolean; description: string }> {
    const res = await fetch('/api/config/demo-mode');
    return res.json();
  },

  async toggleDemoMode(enabled: boolean): Promise<boolean> {
    const res = await fetch('/api/config/demo-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled })
    });
    const json = await res.json();
    return json.demo_sqli_mode;
  }
};
