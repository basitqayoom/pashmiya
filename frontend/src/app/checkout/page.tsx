'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useCart, CartItem } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { api } from '@/lib/api';
import styles from './checkout.module.css';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";

interface ShippingForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

interface ShippingRate {
  courier_name: string;
  rate: number;
  currency: string;
  estimated_days: number;
  service_type: string;
  courier_company_id?: number;
}

interface ShippingRate {
  courier_name: string;
  rate: number;
  currency: string;
  estimated_days: number;
  service_type: string;
  courier_company_id?: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, totalPrice, clearCart, removeFromCart } = useCart();
  const { formatPrice, currency } = useCurrency();
  
  const isBuyNow = searchParams.get('buyNow') === 'true';
  const productId = searchParams.get('productId');
  
  const [buyNowProduct, setBuyNowProduct] = useState<CartItem | null>(null);
  const [loading, setLoading] = useState(isBuyNow);
  
  const [form, setForm] = useState<ShippingForm>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Handle Buy Now mode - get the last added item for this product
  useEffect(() => {
    if (isBuyNow && productId) {
      // Find the product in cart (it was just added by Buy Now)
      const cartItem = items.find(item => item.product.id.toString() === productId);
      if (cartItem) {
        setBuyNowProduct(cartItem);
      }
      setLoading(false);
    }
  }, [isBuyNow, productId, items]);

  // Determine which items to show
  const checkoutItems = isBuyNow && buyNowProduct 
    ? [buyNowProduct] 
    : items;
  
  const checkoutTotal = checkoutItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity, 
    0
  );

  const finalTotal = checkoutTotal + (selectedRate?.rate || 0);

  // Calculate shipping rates when address is filled
  useEffect(() => {
    if (form.country && form.zip && form.zip.length >= 4) {
      calculateShipping();
    }
  }, [form.country, form.zip]);

  const calculateShipping = async () => {
    try {
      // For now, using default pickup pin (you should set this in your env)
      const pickupPin = process.env.NEXT_PUBLIC_PICKUP_PIN || '110001';
      const response = await api.calculateShippingRates(pickupPin, form.zip, 0.5, 0);
      
      if (response.rates && response.rates.length > 0) {
        setShippingRates(response.rates);
        // Select the cheapest rate by default
        setSelectedRate(response.rates[0]);
      }
    } catch (err) {
      console.error('Error calculating shipping:', err);
      // Set default rates if API fails
      setShippingRates([
        { courier_name: 'Standard Shipping', rate: 150, currency: 'INR', estimated_days: 5, service_type: 'standard' },
        { courier_name: 'Express Shipping', rate: 300, currency: 'INR', estimated_days: 2, service_type: 'express' }
      ]);
      setSelectedRate({ courier_name: 'Standard Shipping', rate: 150, currency: 'INR', estimated_days: 5, service_type: 'standard' });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof ShippingForm)[] = ['name', 'email', 'phone', 'address', 'city', 'state', 'country', 'zip'];
    const missingFields = requiredFields.filter(field => !form[field].trim());
    
    if (missingFields.length > 0) {
      setError('Please fill in all required fields');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Phone validation
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(form.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }

    if (!selectedRate) {
      setError('Please select a shipping method');
      return false;
    }

    return true;
  };

  const handleRazorpayPayment = async () => {
    if (!validateForm()) return;
    if (!razorpayLoaded) {
      setError('Payment system is loading. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Create order in backend
      const orderData = {
        user_id: null, // Will be set if user is logged in
        status: 'pending_payment',
        total_amount: finalTotal,
        shipping_cost: selectedRate?.rate || 0,
        currency: currency,
        shipping_name: form.name,
        shipping_email: form.email,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_country: form.country,
        shipping_zip: form.zip,
        shipping_phone: form.phone,
        payment_method: 'razorpay',
        items: checkoutItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          color: item.selectedColor,
          size: item.selectedSize,
        })),
      };

      const orderResponse = await api.createOrder(orderData);
      
      if (!orderResponse.id && !orderResponse.order_id) {
        throw new Error('Failed to create order');
      }

      const orderId = orderResponse.id || orderResponse.order_id;

      // Step 2: Create Razorpay payment intent
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        throw new Error('Payment configuration error');
      }

      // Convert amount to paise for Razorpay
      const amountInPaise = Math.round(finalTotal * 100);

      // Create Razorpay order
      const paymentIntent = await api.createPaymentIntent(
        finalTotal,
        currency.code,
        `order_${orderId}`,
        { order_id: orderId }
      );

      if (!paymentIntent.id) {
        throw new Error('Failed to create payment intent');
      }

      // Step 3: Initialize Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: amountInPaise,
        currency: currency,
        name: 'Pashmiya',
        description: `Order #${orderId}`,
        order_id: paymentIntent.id,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: '#1c1917',
        },
        handler: async function (response: any) {
          try {
            // Step 4: Verify payment
            const verifyResponse = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: orderId,
            });

            if (verifyResponse.success) {
              // Clear cart and redirect to success
              if (isBuyNow && buyNowProduct) {
                removeFromCart(buyNowProduct.product.id);
              } else {
                clearCart();
              }
              router.push(`/checkout/success?orderId=${orderId}`);
            } else {
              setError('Payment verification failed. Please contact support.');
              setIsSubmitting(false);
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function() {
            setIsSubmitting(false);
          },
        },
      };

      // @ts-ignore
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.empty}>
            <h1>Checkout</h1>
            <p>Your cart is empty</p>
            <Link href="/shop" className={styles.shopButton}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => setError('Failed to load payment system')}
      />
      
      <div className={styles.page}>
        <div className={styles.container}>
          <h1>Checkout</h1>
          
          {isBuyNow && (
            <div className={styles.modeBanner}>
              <span>Quick Purchase - Single Item</span>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.checkoutLayout}>
            {/* Shipping Form */}
            <div className={styles.formSection}>
              <div className={styles.form}>
                <h2>Shipping Information</h2>
                
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="country">Country *</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={form.country}
                      onChange={handleInputChange}
                      placeholder="India"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="address">Street Address *</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street, Apt 4B"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleInputChange}
                      placeholder="Mumbai"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="state">State / Province *</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={form.state}
                      onChange={handleInputChange}
                      placeholder="Maharashtra"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="zip">ZIP / Postal Code *</label>
                    <input
                      type="text"
                      id="zip"
                      name="zip"
                      value={form.zip}
                      onChange={handleInputChange}
                      placeholder="400001"
                      required
                    />
                  </div>
                </div>

                {/* Shipping Method Selection */}
                {shippingRates.length > 0 && (
                  <div className={styles.shippingSection}>
                    <h3>Shipping Method</h3>
                    <div className={styles.shippingOptions}>
                      {shippingRates.map((rate, index) => (
                        <label 
                          key={index} 
                          className={`${styles.shippingOption} ${selectedRate === rate ? styles.selected : ''}`}
                        >
                          <input
                            type="radio"
                            name="shipping"
                            checked={selectedRate === rate}
                            onChange={() => setSelectedRate(rate)}
                          />
                          <div className={styles.shippingOptionContent}>
                            <span className={styles.shippingName}>{rate.courier_name}</span>
                            <span className={styles.shippingTime}>{rate.estimated_days} days</span>
                            <span className={styles.shippingPrice}>{formatPrice(rate.rate)}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.paymentSection}>
                  <div className={styles.paymentNote}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <p>
                      <strong>Secure Payment with Razorpay</strong>
                      <br />
                      Pay securely using UPI, Cards, NetBanking, or Wallets
                    </p>
                  </div>

                  <button 
                    type="button" 
                    className={styles.submitButton}
                    disabled={isSubmitting || !razorpayLoaded}
                    onClick={handleRazorpayPayment}
                  >
                    {isSubmitting ? 'Processing...' : `Pay ${formatPrice(finalTotal)}`}
                  </button>
                </div>
                
                {!isBuyNow && (
                  <Link href="/cart" className={styles.backLink}>
                    ← Back to Cart
                  </Link>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className={styles.summarySection}>
              <div className={styles.summaryCard}>
                <h2>Order Summary</h2>
                
                <div className={styles.itemsList}>
                  {checkoutItems.map(item => (
                    <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className={styles.item}>
                      <div className={styles.itemImage}>
                        <img 
                          src={item.product.image || PLACEHOLDER_IMAGE} 
                          alt={item.product.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                          }}
                        />
                      </div>
                      <div className={styles.itemDetails}>
                        <h4>{item.product.name}</h4>
                        <p className={styles.variant}>
                          {item.selectedSize} / {item.selectedColor}
                        </p>
                        <p className={styles.quantity}>Qty: {item.quantity}</p>
                        <p className={styles.price}>{formatPrice(item.product.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.summaryDivider} />

                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatPrice(checkoutTotal)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>{selectedRate ? formatPrice(selectedRate.rate) : 'Calculated at checkout'}</span>
                </div>
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LoadingCheckout() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.loading}>Loading checkout...</div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingCheckout />}>
      <CheckoutContent />
    </Suspense>
  );
}
