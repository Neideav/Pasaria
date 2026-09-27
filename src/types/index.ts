export interface ColorOption {
  name: string;
  hex: string;
  active?: boolean;
}

export interface ProductSpecs {
  General?: Record<string, string>;
  ProductDetails?: Record<string, string>;
  [key: string]: Record<string, string> | undefined;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: string;
  price: number;
  original_price?: number;
  monthly_price?: number;
  short_desc?: string;
  description: string;
  image: string;
  rating: number;
  review_count: number;
  stock: number;
  colors?: ColorOption[];
  specs?: ProductSpecs;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  item_count: number;
  icon?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address?: string;
  city?: string;
  zip?: string;
  phone?: string;
  role: 'customer' | 'admin';
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  payment_method: string;
  subtotal: number;
  tax: number;
  discount: number;
  shipping_cost: number;
  total: number;
  status: string;
  items?: Array<{
    id: number;
    name: string;
    slug: string;
    price: number;
    quantity: number;
    color?: string;
    image?: string;
  }>;
  created_at: string;
}
