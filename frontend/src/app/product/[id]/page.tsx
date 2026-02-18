'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Product } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import Link from 'next/link';
import styles from './page.module.css';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.getProduct(params.id as string)
      .then(data => {
        setProduct(data);
        // Auto-select first size and color
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        if (data.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className={styles.page}><div className={styles.container}>Loading...</div></div>;
  }

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h1>Product Not Found</h1>
        <button onClick={() => router.push('/shop')}>Back to Shop</button>
      </div>
    );
  }

  const isOutOfStock = !product.stock || product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product as any, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product as any, selectedSize, selectedColor);
    router.push(`/checkout?buyNow=true&productId=${product.id}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
          <div className={styles.imageSection}>
          <div className={styles.imageWrapper}>
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                }}
              />
            ) : (
              <img 
                src={PLACEHOLDER_IMAGE} 
                alt="No image"
              />
            )}
          </div>
        </div>

        <div className={styles.details}>
          <span className={styles.category}>{product.category?.name}</span>
          <h1>{product.name}</h1>
          <p className={styles.price}>{formatPrice(product.price)}</p>
          {isOutOfStock && (
            <p className={styles.outOfStock}>Out of Stock</p>
          )}

          <p className={styles.description}>{product.description}</p>

          <div className={styles.options}>
            <div className={styles.optionGroup}>
              <label>Size</label>
              <div className={styles.optionButtons}>
                {product.sizes?.map(size => (
                  <button
                    key={size}
                    className={`${styles.optionButton} ${selectedSize === size ? styles.active : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.optionGroup}>
              <label>Color</label>
              <div className={styles.optionButtons}>
                {product.colors?.map(color => (
                  <button
                    key={color}
                    className={`${styles.optionButton} ${selectedColor === color ? styles.active : ''}`}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.addButton} ${added ? styles.added : ''}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock || !selectedSize || !selectedColor}
            >
              {isOutOfStock ? 'Out of Stock' : added ? 'Added to Cart' : 'Add to Cart'}
            </button>
            <button
              className={styles.buyButton}
              onClick={handleBuyNow}
              disabled={isOutOfStock || !selectedSize || !selectedColor}
            >
              Buy Now
            </button>
            <Link href="/cart" className={styles.viewCartButton}>
              View Cart
            </Link>
          </div>

          {!selectedSize || !selectedColor ? (
            <p className={styles.hint}>Please select size and color</p>
          ) : null}

          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
                <path d="M12 3l8 6H4l8-6z" />
              </svg>
              <span>Handwoven in Kashmir</span>
            </div>
            <div className={styles.detailItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>Made to order (2-3 weeks)</span>
            </div>
            <div className={styles.detailItem}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Worldwide shipping</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
