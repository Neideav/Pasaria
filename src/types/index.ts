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

export interface Shop {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logo?: string;
  banner?: string;
  city: string;
  phone?: string;
  rating: number;
  product_count?: number;
  total_sales?: number;
  joined_date?: string;
  is_verified?: boolean;
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
  shop_id?: number;
  shop_name?: string;
  shop_city?: string;
  shop_logo?: string;
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
  avatar?: string;
  address?: string;
  city?: string;
  zip?: string;
  phone?: string;
  role: 'customer' | 'admin' | 'seller';
  shop?: Shop | null;
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
  courier?: string;
  courier_service?: string;
  tracking_number?: string;
  estimated_delivery?: string;
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

export interface TrackingCheckpoint {
  id: string;
  title: string;
  location: string;
  timestamp: string;
  status: 'completed' | 'current' | 'upcoming';
  description?: string;
}

export interface DeliveryShipment {
  id: string;
  order_number: string;
  courier_name: string;
  courier_service: string;
  courier_logo?: string;
  tracking_number: string;
  status: 'processing' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered';
  status_label: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  origin_address: string;
  estimated_arrival: string;
  driver_name?: string;
  driver_phone?: string;
  driver_vehicle?: string;
  current_location: string;
  items_count: number;
  items_preview?: Array<{
    name: string;
    quantity: number;
    image?: string;
    color?: string;
  }>;
  total_amount: number;
  created_at: string;
  checkpoints: TrackingCheckpoint[];
}
