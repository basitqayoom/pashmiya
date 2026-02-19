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

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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
  discount_amount: number;
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

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const setAuthToken = (token: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
};

const removeAuthToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    removeAuthToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    throw new ApiError('Session expired. Please login again.', 401);
  }
  
  if (!res.ok) {
    const error = await res.text();
    try {
      const jsonError = JSON.parse(error);
      throw new ApiError(jsonError.error || 'An error occurred', res.status);
    } catch {
      throw new ApiError(error || 'An error occurred', res.status);
    }
  }
  
  return res.json();
};

export const authApi = {
  async register(name: string, email: string, password: string, phone?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });
    const data = await handleResponse(res);
    if (data.token) {
      setAuthToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    if (data.token) {
      setAuthToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      });
    } finally {
      removeAuthToken();
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    const data = await handleResponse(res);
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_URL}/user/me`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async updateCurrentUser(data: { name?: string; phone?: string }): Promise<User> {
    const res = await fetch(`${API_URL}/user/me`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(data),
    });
    const user = await handleResponse(res);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  getToken(): string | null {
    return getAuthToken();
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!getAuthToken();
  },
};

export const api = {
  async getProducts(params?: { category?: string; featured?: boolean; page?: number; limit?: number; sort?: string; order?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.featured) query.set('featured', 'true');
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.sort) query.set('sort', params.sort);
    if (params?.order) query.set('order', params.order);
    
    const res = await fetch(`${API_URL}/products?${query}`);
    return handleResponse(res);
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`${API_URL}/products/${id}`);
    return handleResponse(res);
  },

  async searchProducts(query: string): Promise<Product[]> {
    const res = await fetch(`${API_URL}/products/search?q=${encodeURIComponent(query)}`);
    return handleResponse(res);
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_URL}/categories`);
    return handleResponse(res);
  },

  async getFilterOptions(): Promise<FilterOptions> {
    const res = await fetch(`${API_URL}/filters`);
    return handleResponse(res);
  },

  async subscribeNewsletter(email: string): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  async getCatalogues(params?: { status?: string; search?: string }): Promise<Catalogue[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    
    const res = await fetch(`${API_URL}/catalogues?${query}`);
    return handleResponse(res);
  },

  async getCatalogue(id: string): Promise<Catalogue> {
    const res = await fetch(`${API_URL}/catalogues/${id}`);
    return handleResponse(res);
  },

  async getContent(page: string) {
    const res = await fetch(`${API_URL}/content/${page}`);
    return handleResponse(res);
  },

  async getProductReviews(productId: string): Promise<Review[]> {
    const res = await fetch(`${API_URL}/products/${productId}/reviews`);
    return handleResponse(res);
  },

  async createReview(data: { product_id: number; rating: number; title?: string; comment?: string }): Promise<Review> {
    const res = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateReview(id: number, data: { rating?: number; title?: string; comment?: string }): Promise<Review> {
    const res = await fetch(`${API_URL}/reviews/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteReview(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/reviews/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getWishlist(): Promise<WishlistItem[]> {
    const res = await fetch(`${API_URL}/wishlist`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async addToWishlist(productId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/wishlist`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify({ product_id: productId }),
    });
    return handleResponse(res);
  },

  async removeFromWishlist(productId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getAddresses(): Promise<Address[]> {
    const res = await fetch(`${API_URL}/addresses`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async createAddress(address: Omit<Address, 'id' | 'user_id'>): Promise<Address> {
    const res = await fetch(`${API_URL}/addresses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(address),
    });
    return handleResponse(res);
  },

  async updateAddress(id: number, address: Partial<Address>): Promise<Address> {
    const res = await fetch(`${API_URL}/addresses/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(address),
    });
    return handleResponse(res);
  },

  async deleteAddress(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_URL}/addresses/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getOrders(params?: { status?: string }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    
    const res = await fetch(`${API_URL}/orders?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getOrder(id: string): Promise<Order> {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async createOrder(orderData: {
    items: { product_id: number; quantity: number; price: number; color?: string; size?: string }[];
    total_amount: number;
    discount_amount?: number;
    shipping_cost?: number;
    tax_amount?: number;
    shipping_name: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_country: string;
    shipping_zip: string;
    shipping_phone: string;
    shipping_email?: string;
    coupon_code?: string;
    notes?: string;
  }): Promise<{ order_id: number; status: string; message: string }> {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(orderData),
    });
    return handleResponse(res);
  },

  async cancelOrder(orderId: string): Promise<{ order_id: number; status: string; message: string }> {
    const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getOrderTracking(orderId: string) {
    const res = await fetch(`${API_URL}/orders/${orderId}/tracking`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async calculateShippingRates(pickupPin: string, deliveryPin: string, weight?: number, cod: number = 0) {
    const query = new URLSearchParams({ pickup_pin: pickupPin, delivery_pin: deliveryPin });
    if (weight) query.set('weight', weight.toString());
    query.set('cod', cod.toString());
    
    const res = await fetch(`${API_URL}/shipping/calculate-rates?${query}`);
    return handleResponse(res);
  },

  async validateCoupon(code: string, amount?: number): Promise<Coupon & { valid: boolean; error?: string }> {
    const query = new URLSearchParams({ code });
    if (amount) query.set('amount', amount.toString());
    
    const res = await fetch(`${API_URL}/coupons/validate?${query}`);
    return handleResponse(res);
  },

  async createPaymentIntent(amount: number, currency: string, receipt?: string, notes?: Record<string, any>) {
    const res = await fetch(`${API_URL}/payments/create-intent`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify({ amount, currency, receipt, notes }),
    });
    return handleResponse(res);
  },

  async verifyPayment(data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; order_id: number }) {
    const res = await fetch(`${API_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getPaymentStatus(paymentId: string) {
    const res = await fetch(`${API_URL}/payments/${paymentId}/status`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async getNotificationPreferences(): Promise<NotificationPreference> {
    const res = await fetch(`${API_URL}/notifications/preferences`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async updateNotificationPreferences(preferences: Partial<NotificationPreference>): Promise<NotificationPreference> {
    const res = await fetch(`${API_URL}/notifications/preferences`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      },
      body: JSON.stringify(preferences),
    });
    return handleResponse(res);
  },

  async getNotifications(): Promise<{ notifications: Notification[]; unread_count: number }> {
    const res = await fetch(`${API_URL}/notifications/user`, {
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async markNotificationAsRead(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async markAsRead(id: number): Promise<void> {
    return this.markNotificationAsRead(id);
  },

  async markAllNotificationsAsRead(): Promise<void> {
    const res = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },

  async markAllAsRead(): Promise<void> {
    return this.markAllNotificationsAsRead();
  },

  async deleteNotification(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    return handleResponse(res);
  },
};

export { ApiError };
