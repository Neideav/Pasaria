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

export interface ProductVariant {
  id: number;
  product_id: number;
  sku?: string;
  name: string;
  attributes_json?: any;
  price: number;
  stock: number;
  weight_grams?: number;
  image?: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
}

export interface Shop {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  slogan?: string;
  tagline?: string;
  description?: string;
  logo?: string;
  banner?: string;
  city: string;
  phone?: string;
  rating: number;
  review_count?: number;
  product_count?: number;
  products_count?: number;
  followers_count?: number;
  total_sales?: number;
  joined_date?: string;
  is_verified?: boolean;
  verified?: boolean;
  status?: string;
  notify_new_products?: boolean;
  created_at?: string;
}

export interface Product {
  id: number;
  title?: string;
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
  variants?: ProductVariant[];
  images?: ProductImage[];
  badge?: string;
  discount_percent?: number;
  is_wishlisted?: boolean;
  is_active?: boolean;
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
  variant_id?: number;
}

export interface UserAddress {
  id: number;
  user_id: number;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  province?: string;
  postal_code: string;
  is_default: boolean;
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
  role: "customer" | "admin" | "seller" | "support";
  status?: "active" | "suspended";
  shop?: Shop | null;
  addresses?: UserAddress[];
  email_verified_at?: string | null;
  two_factor_enabled?: boolean;
}

export interface OrderItemType {
  id: number;
  order_id: number;
  shop_id?: number;
  product_id?: number;
  variant_id?: number;
  name?: string;
  slug?: string;
  product_name: string;
  product_slug?: string;
  price: number;
  quantity: number;
  color?: string;
  image?: string;
  subtotal?: number;
  review?: Review | null;
}

export interface Order {
  id: number;
  order_number: string;
  master_order_number?: string;
  user_id: number;
  shop_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
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
  voucher_code?: string;
  voucher_discount?: number;
  items?: OrderItemType[];
  created_at: string;
}

export interface TrackingCheckpoint {
  id: string;
  title: string;
  location: string;
  timestamp: string;
  status: "completed" | "current" | "upcoming";
  description?: string;
}

export interface DeliveryShipment {
  id: string;
  shipment_id?: string;
  order_number: string;
  user_id?: number;
  courier_name: string;
  courier_service: string;
  courier_logo?: string;
  tracking_number: string;
  status:
    | "processing"
    | "picked_up"
    | "in_transit"
    | "out_for_delivery"
    | "delivered";
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
    name?: string;
    quantity: number;
    image?: string;
    color?: string;
  }>;
  total_amount: number;
  created_at: string;
  checkpoints: TrackingCheckpoint[];
}

export interface ReviewMedia {
  id: number;
  review_id: number;
  media_url: string;
  media_type: "image" | "video";
}

export interface Review {
  id: number;
  user_id: number;
  order_id?: number;
  order_item_id?: number;
  product_id: number;
  shop_id?: number;
  rating: number;
  review_text?: string;
  is_anonymous: boolean;
  is_verified_purchase: boolean;
  status: string;
  seller_reply?: string;
  replied_at?: string;
  created_at: string;
  user?: User;
  media?: ReviewMedia[];
}

export interface ProductAnswer {
  id: number;
  question_id: number;
  user_id: number;
  shop_id?: number;
  answer: string;
  status: string;
  created_at: string;
  shop?: Shop;
}

export interface ProductQuestion {
  id: number;
  product_id: number;
  user_id: number;
  question: string;
  is_public: boolean;
  status: string;
  created_at: string;
  user?: User;
  answers?: ProductAnswer[];
}

export interface Voucher {
  id: number;
  code: string;
  name: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_type: "customer" | "seller";
  message: string;
  attachment_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: number;
  shop_id: number;
  customer_id: number;
  last_message_at?: string;
  last_message?: string;
  unread_count?: number;
  shop?: Shop;
  customer?: User;
}

export interface OrderReturn {
  id: number;
  order_id: number;
  user_id: number;
  shop_id?: number;
  status:
    | "requested"
    | "approved"
    | "rejected"
    | "in_transit"
    | "received"
    | "refunded"
    | "disputed";
  reason: string;
  description: string;
  evidence_urls_json?: string[];
  requested_amount: number;
  refund_amount: number;
  seller_note?: string;
  admin_note?: string;
  created_at: string;
  order?: Order;
}

export interface Dispute {
  id: number;
  return_id: number;
  order_id: number;
  user_id: number;
  shop_id?: number;
  status: "open" | "under_review" | "resolved" | "closed";
  resolution?: string;
  resolution_note?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export * from "./toast";
export type ValidationErrors = Record<string, string[]>;

export interface OrderCalculationItemInput {
  product_id: number;
  variant_id?: number;
  quantity: number;
}

export interface OrderCalculationRequest {
  items: OrderCalculationItemInput[];
  voucher_code?: string;
  shipping_method?: string;
}

export interface OrderCalculationResult {
  subtotal: number;
  shipping_cost: number;
  tax: number;
  discount: number;
  voucher_discount: number;
  total: number;
}

export interface CheckoutOrderItemInput {
  product_id: number;
  variant_id?: number;
  quantity: number;
  color?: string;
}

export interface CheckoutOrderInput {
  items: CheckoutOrderItemInput[];
  recipient_name: string;
  recipient_phone: string;
  customer_name?: string;
  customer_phone?: string;
  shipping_address: string;
  payment_method: string;
  shipping_method?: string;
  voucher_code?: string;
  idempotency_key?: string;
}

export interface CheckoutOrderResult {
  success: boolean;
  message?: string;
  order_number: string;
  order_id: number;
  total: number;
  tracking_number?: string;
  shipment?: DeliveryShipment;
  payment?: any;
  idempotent?: boolean;
}

export interface SellerDashboardResult {
  shop?: Shop;
  stats?: {
    total_revenue?: number;
    total_orders?: number;
    total_products?: number;
    active_products?: number;
    total_sales?: number;
  };
  recent_orders?: Order[];
}

export interface SellerWallet {
  id?: number;
  shop_id?: number;
  balance: number;
  reserved_balance: number;
  pending_balance: number;
  available_balance: number;
  total_withdrawn: number;
}

export interface WalletTransactionItem {
  id: number;
  wallet_id: number;
  type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  reference_type?: string;
  reference_id?: string;
  description: string;
  created_at: string;
}

export interface SellerPayoutItem {
  id: number;
  shop_id: number;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reference_id: string;
  created_at: string;
}

export interface SellerFinancesResult {
  wallet?: SellerWallet;
  transactions?: WalletTransactionItem[];
  payouts?: SellerPayoutItem[];
}

export interface SellerInventoryItem {
  id: number;
  product_id: number;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  is_active?: boolean;
  product?: {
    id: number;
    name: string;
    image?: string;
  };
}

export interface AdminDashboardResult {
  total_users?: number;
  total_sellers?: number;
  total_products?: number;
  total_orders?: number;
  gmv?: number;
  pending_returns?: number;
  pending_disputes?: number;
  pending_reports?: number;
  reported_reviews?: number;
  recent_orders?: Order[];
  recent_users?: User[];
  metrics?: any;
  [key: string]: any;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  action: string;
  target_type?: string;
  target_id?: number;
  details_json?: any;
  created_at: string;
  user?: User;
}

export interface UserNotificationPreferences {
  id?: number;
  user_id?: number;
  order_updates_email: boolean;
  order_updates_in_app: boolean;
  chat_messages_email: boolean;
  chat_messages_in_app: boolean;
  promotions_email: boolean;
  promotions_in_app: boolean;
  wishlist_alerts_email: boolean;
  wishlist_alerts_in_app: boolean;
  security_alerts_email: boolean;
  security_alerts_in_app: boolean;
  shipping_updates_email?: boolean;
  shipping_updates_in_app?: boolean;
  product_qa_email?: boolean;
  product_qa_in_app?: boolean;
  review_activity_email?: boolean;
  review_activity_in_app?: boolean;
  shop_updates_email?: boolean;
  shop_updates_in_app?: boolean;
  price_alerts_email?: boolean;
  price_alerts_in_app?: boolean;
  stock_alerts_email?: boolean;
  stock_alerts_in_app?: boolean;
  quiet_hours_enabled?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_timezone?: string;
  timezone?: string;
  shipping_delivery_email?: boolean;
  shipping_delivery_in_app?: boolean;
  qa_answers_email?: boolean;
  qa_answers_in_app?: boolean;
  email_digest_frequency?: 'instant' | 'daily' | 'weekly';
  updated_at?: string;
}

export interface UserPrivacyPreferences {
  id?: number;
  user_id?: number;
  personalization_enabled: boolean;
  marketing_communication: boolean;
  activity_logging: boolean;
  default_anonymous_reviews?: boolean;
  show_profile_publicly?: boolean;
  updated_at?: string;
}

export interface UserShoppingPreferences {
  id?: number;
  user_id?: number;
  favorite_categories: string[];
  favorite_brands: string[];
  min_price: number | null;
  max_price: number | null;
  hide_out_of_stock: boolean;
  prioritize_official_stores: boolean;
  default_sort: 'popular' | 'price_asc' | 'price_desc' | 'rating' | 'newest';
  preferred_density: 'comfortable' | 'compact';
  recommendation_personalization: boolean;
  theme: 'light' | 'dark' | 'system';
  font_size: 'normal' | 'large';
  reduced_motion: boolean;
  high_contrast: boolean;
  updated_at?: string;
}

export interface ProductAlert {
  id: number;
  user_id: number;
  product_id: number;
  alert_type: 'price_drop' | 'back_in_stock' | 'target_price' | 'shop_new_product';
  target_price?: number | null;
  last_observed_price?: number | null;
  is_active: boolean;
  last_notified_at?: string | null;
  created_at: string;
  product?: {
    id: number;
    name: string;
    slug: string;
    price: number;
    original_price?: number | null;
    image?: string;
    stock: number;
    is_active: boolean;
    shop_name?: string;
  } | null;
}

export interface UserSearchHistoryItem {
  id: number;
  user_id: number;
  query: string;
  created_at: string;
  updated_at: string;
}

export interface UserViewedProductItem {
  id: number;
  user_id: number;
  product_id: number;
  viewed_at: string;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    original_price?: number | null;
    image?: string;
    stock: number;
    is_active: boolean;
    shop_name?: string;
    rating: number;
    review_count: number;
  };
}

export interface SellerPreferences {
  id?: number;
  user_id?: number;
  shop_id?: number;
  notify_new_orders: boolean;
  notify_customer_chat: boolean;
  notify_low_stock: boolean;
  notify_reviews: boolean;
  notify_returns: boolean;
  low_stock_threshold: number;
  vacation_mode: boolean;
  vacation_message?: string | null;
  vacation_start?: string | null;
  vacation_end?: string | null;
  updated_at?: string;
}

export interface CatalogMetadataCategory {
  id: number;
  name: string;
  slug: string;
}

export interface CatalogMetadataBrand {
  id: number;
  name: string;
  slug: string;
}

export interface UserSession {
  id: number;
  name: string;
  is_current: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  confirmed_at?: string | null;
}

export interface TwoFactorSetupResult {
  secret: string;
  qr_uri: string;
  recovery_codes: string[];
}

export interface UserDataExport {
  generated_at: string;
  platform: string;
  user: Partial<User>;
  addresses: UserAddress[];
  orders: any[];
  reviews: any[];
  notifications: any[];
}

