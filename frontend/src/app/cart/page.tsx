'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import styles from './page.module.css';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { formatPrice } = useCurrency();

  if (items.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h1>Your Cart</h1>
          <p>Your cart is empty</p>
          <Link href="/shop" className={styles.shopButton}>Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1>Your Cart</h1>

        <div className={styles.cartLayout}>
          <div className={styles.items}>
            {items.map(item => (
              <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className={styles.item}>
                <div className={styles.itemImage}>
                  <img 
                    src={item.product.image || PLACEHOLDER_IMAGE} 
                    alt={item.product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                    }}
                  />
                </div>
                <div className={styles.itemDetails}>
                  <h3>{item.product.name}</h3>
                  <p className={styles.variant}>
                    {item.selectedSize} / {item.selectedColor}
                  </p>
                  <p className={styles.itemPrice}>
                    {formatPrice(item.product.price)}
                  </p>
                  {item.product.stock && item.product.stock > 0 && (
                    <p className={styles.stockInfo}>
                      {item.product.stock} available in stock
                    </p>
                  )}
                  <div className={styles.quantity}>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className={styles.quantityButton}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className={styles.quantityButton}
                      disabled={item.product.stock ? item.quantity >= item.product.stock : false}
                    >
                      +
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.product.id)}
                  className={styles.removeButton}
                  aria-label="Remove item"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <h3>Order Summary</h3>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <p className={styles.shippingNote}>
              Shipping costs will be calculated based on your delivery address
            </p>
            <Link href="/checkout" className={styles.checkoutButton}>
              Proceed to Checkout
            </Link>
            <button onClick={clearCart} className={styles.clearButton}>Clear Cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}
