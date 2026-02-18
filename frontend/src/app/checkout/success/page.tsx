'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { api, Order } from '@/lib/api';
import styles from './success.module.css';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setLoading(false);
      setError('No order ID found');
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      const data = await api.getOrder(id);
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Could not load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading your order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <h1>Order Not Found</h1>
            <p>{error || 'We could not find your order details.'}</p>
            <Link href="/shop" className={styles.button}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.icon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          
          <h1>Order Confirmed!</h1>
          <p className={styles.message}>
            Thank you for your purchase. Your order has been received and is being processed.
          </p>

          <div className={styles.orderInfo}>
            <div className={styles.infoRow}>
              <span>Order Number</span>
              <strong>#{order.id}</strong>
            </div>
            <div className={styles.infoRow}>
              <span>Status</span>
              <span className={styles.statusBadge}>{order.status}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Order Date</span>
              <span>{new Date(order.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className={styles.itemsSection}>
              <h3>Order Items</h3>
              <div className={styles.itemsList}>
                {order.items.map((item, index) => (
                  <div key={index} className={styles.item}>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemName}>{item.product?.name || `Product #${item.product_id}`}</span>
                      <span className={styles.itemVariant}>
                        {item.size} / {item.color} · Qty: {item.quantity}
                      </span>
                    </div>
                    <span className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.summarySection}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatPrice(order.total_amount - (order.shipping_cost || 0))}</span>
            </div>
            {order.shipping_cost && (
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>{formatPrice(order.shipping_cost)}</span>
              </div>
            )}
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          <div className={styles.shippingSection}>
            <h3>Shipping Address</h3>
            <div className={styles.address}>
              <p className={styles.addressName}>{order.shipping_name}</p>
              <p>{order.shipping_address}</p>
              <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
              <p>{order.shipping_country}</p>
              {order.shipping_phone && <p className={styles.phone}>{order.shipping_phone}</p>}
            </div>
          </div>

          <div className={styles.note}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 12 15 16 10" />
            </svg>
            <p>
              Payment successful! You will receive an email confirmation shortly.
              We'll update you once your order ships.
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/shop" className={styles.primaryButton}>
              Continue Shopping
            </Link>
            <Link href="/" className={styles.secondaryButton}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
