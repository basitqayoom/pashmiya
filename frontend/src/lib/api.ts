export interface ColorOption {
  name: string;
  hex: string;
}

export const colorMap: Record<string, string> = {
  'Black': '#1a1a1a',
  'White': '#ffffff',
  'Ivory': '#fffff0',
  'Cream': '#fffdd0',
  'Beige': '#f5f5dc',
  'Camel': '#c19a6b',
  'Brown': '#8b4513',
  'Burgundy': '#800020',
  'Maroon': '#800000',
  'Red': '#dc143c',
  'Pink': '#ffc0cb',
  'Rose': '#ff007f',
  'Gold': '#ffd700',
  'Orange': '#ff8c00',
  'Peach': '#ffdab9',
  'Green': '#228b22',
  'Olive': '#808000',
  'Sage': '#9dc183',
  'Mint': '#98ff98',
  'Teal': '#008080',
  'Turquoise': '#40e0d0',
  'Blue': '#4169e1',
  'Navy': '#000080',
  'Royal Blue': '#4169e1',
  'Sky Blue': '#87ceeb',
  'Lavender': '#e6e6fa',
  'Purple': '#800080',
  'Violet': '#ee82ee',
  'Grey': '#808080',
  'Gray': '#808080',
  'Silver': '#c0c0c0',
  'Charcoal': '#36454f',
  'Multi': '#gradient',
};

export function getColorHex(colorName: string): string {
  return colorMap[colorName] || '#808080';
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface Product {
  id: number;
  name: string;
  slug?: string;
  price: number;
  compare_price?: number;
  description: string;
  image: string;
  images?: string[];
  category_id: number;
  category?: { id: number; name: string };
  colors: string[];
  sizes: string[];
  stock: number;
  is_featured: boolean;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  is_active?: boolean;
}

export interface FilterOptions {
  colors: string[];
  sizes: string[];
  min_price: number;
  max_price: number;
}

export interface Notification {
  id: number;
  user_id?: number;
  type: string;
  channel: string;
  title: string;
  message: string;
  data?: string[];
  status: string;
  created_at: string;
  sent_at?: string;
  read_at?: string;
}

export interface NotificationPreference {
  id: number;
  user_id: number;
  order_created: boolean;
  order_shipped: boolean;
  order_delivered: boolean;
  order_status: boolean;
  low_stock: boolean;
  product_updates: boolean;
  newsletter: boolean;
  marketing: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  token?: string;
}

export interface Order {
  id: number;
  user_id: number;
  status: string;
  total_amount: number;
  discount_amount?: number;
  shipping_cost?: number;
  tax_amount?: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state?: string;
  shipping_country: string;
  shipping_zip: string;
  shipping_phone?: string;
  coupon_code?: string;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  price: number;
  color: string;
  size: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user?: { id: number; name: string };
  rating: number;
  title?: string;
  comment?: string;
  is_verified: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
}

export interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  product: Product;
  created_at: string;
}

export interface Address {
  id: number;
  user_id: number;
  type: string;
  is_default: boolean;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  landmark?: string;
}

export interface ShippingRate {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  estimated_days: string;
  free_shipping: boolean;
  min_order?: number;
}

export interface Coupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
}

export interface Catalogue {
  id: number;
  name: string;
  description: string;
  image: string;
  status: boolean;
  sort_order: number;
  products: Product[];
  created_at: string;
}

export interface AuthSettings {
  enable_email_auth: boolean;
  enable_google_auth: boolean;
  enable_phone_auth: boolean;
}

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  async getProducts(params?: { category?: string; featured?: boolean; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.featured) query.set('featured', 'true');
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    
    const res = await fetch(`${API_URL}/products?${query}`);
    return res.json();
  },

  async getProduct(id: string) {
    const res = await fetch(`${API_URL}/products/${id}`);
    return res.json();
  },

  async searchProducts(query: string) {
    const res = await fetch(`${API_URL}/products/search?q=${encodeURIComponent(query)}`);
    return res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_URL}/categories`);
    return res.json();
  },

  async getFilterOptions(): Promise<FilterOptions> {
    const res = await fetch(`${API_URL}/filters`);
    return res.json();
  },

  async subscribeNewsletter(email: string) {
    const res = await fetch(`${API_URL}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async getOrder(id: string) {
    const res = await fetch(`${API_URL}/orders/${id}`);
    return res.json();
  },

  async getUserOrders(userId: string) {
    const res = await fetch(`${API_URL}/orders/user/${userId}`);
    return res.json();
  },

  async getContent(page: string) {
    const res = await fetch(`${API_URL}/content/${page}`);
    return res.json();
  },

  async getProductReviews(productId: string): Promise<{ reviews: Review[]; average_rating: number; total_reviews: number }> {
    const res = await fetch(`${API_URL}/reviews/product/${productId}`);
    return res.json();
  },

  async createReview(data: { product_id: number; rating: number; title?: string; comment?: string }) {
    const res = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getWishlist(): Promise<WishlistItem[]> {
    const res = await fetch(`${API_URL}/wishlist`, {
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async addToWishlist(productId: number) {
    const res = await fetch(`${API_URL}/wishlist`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify({ product_id: productId }),
    });
    return res.json();
  },

  async removeFromWishlist(productId: number) {
    const res = await fetch(`${API_URL}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async getAddresses(): Promise<Address[]> {
    const res = await fetch(`${API_URL}/addresses`, {
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async createAddress(address: Omit<Address, 'id' | 'user_id'>) {
    const res = await fetch(`${API_URL}/addresses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(address),
    });
    return res.json();
  },

  async updateAddress(id: number, address: Partial<Address>) {
    const res = await fetch(`${API_URL}/addresses/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(address),
    });
    return res.json();
  },

  async deleteAddress(id: number) {
    const res = await fetch(`${API_URL}/addresses/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async setDefaultAddress(id: number) {
    const res = await fetch(`${API_URL}/addresses/${id}/default`, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async getNotifications(): Promise<{ notifications: Notification[]; unread_count: number }> {
    const res = await fetch(`${API_URL}/notifications/user`, {
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async getUnreadCount(): Promise<{ unread_count: number }> {
    const res = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async markAsRead(id: number) {
    const res = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async markAllAsRead() {
    const res = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async deleteNotification(id: number) {
    const res = await fetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async getPreferences(): Promise<NotificationPreference> {
    const res = await fetch(`${API_URL}/notifications/preferences`, {
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },

  async updatePreferences(preferences: Partial<NotificationPreference>) {
    const res = await fetch(`${API_URL}/notifications/preferences`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(preferences),
    });
    return res.json();
  },

  async getCatalogues(params?: { status?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    
    const res = await fetch(`${API_URL}/catalogues?${query}`);
    return res.json();
  },

  async getCatalogue(id: string): Promise<Catalogue> {
    const res = await fetch(`${API_URL}/catalogues/${id}`);
    return res.json();
  },

  async calculateTax(country: string, state: string, city: string, amount: number) {
    return { tax_amount: 0 };
  },

  async validateCoupon(code: string) {
    return { valid: false };
  },

  async createOrder(orderData: any) {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to create order: ${error}`);
    }
    return res.json();
  },

  // Payment APIs
  async createPaymentIntent(amount: number, currency: string, receipt?: string, notes?: Record<string, any>) {
    const res = await fetch(`${API_URL}/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, receipt, notes }),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to create payment intent: ${error}`);
    }
    return res.json();
  },

  async verifyPayment(data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; order_id: number }) {
    const res = await fetch(`${API_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Payment verification failed: ${error}`);
    }
    return res.json();
  },

  async getPaymentStatus(paymentId: string) {
    const res = await fetch(`${API_URL}/payments/${paymentId}/status`);
    return res.json();
  },

  // Shipping APIs
  async calculateShippingRates(pickupPin: string, deliveryPin: string, weight?: number, cod: number = 0) {
    const query = new URLSearchParams({ pickup_pin: pickupPin, delivery_pin: deliveryPin });
    if (weight) query.set('weight', weight.toString());
    query.set('cod', cod.toString());
    
    const res = await fetch(`${API_URL}/shipping/calculate-rates?${query}`);
    return res.json();
  },

  async getOrderTracking(orderId: string) {
    const res = await fetch(`${API_URL}/orders/${orderId}/tracking`);
    return res.json();
  },

  async cancelOrder(orderId: string) {
    const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    return res.json();
  },
};
