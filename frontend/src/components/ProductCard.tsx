'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';
import { useCart } from '@/context/CartContext';
import styles from './ProductCard.module.css';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"

interface Product {
  id: number | string;
  name: string;
  price: number;
  description?: string;
  image: string;
  category?: string | { name: string };
  colors?: string[];
  sizes?: string[];
  stock?: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  // Auto-select first options
  const defaultSize = product.sizes?.[0] || 'Standard';
  const defaultColor = product.colors?.[0] || 'Default';
  
  const isOutOfStock = !product.stock || product.stock <= 0;

  const imageSrc = product.image || PLACEHOLDER_IMAGE;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) return;

    const productType = {
      id: Number(product.id),
      name: product.name,
      price: product.price,
      description: product.description || '',
      image: product.image,
      category: typeof product.category === 'string' ? { name: product.category } : product.category,
      colors: product.colors || [],
      sizes: product.sizes || [],
      stock: product.stock
    };

    addToCart(productType, defaultSize, defaultColor);
    setIsAdding(true);
    setTimeout(() => setIsAdding(false), 1500);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock) return;

    const productType = {
      id: Number(product.id),
      name: product.name,
      price: product.price,
      description: product.description || '',
      image: product.image,
      category: typeof product.category === 'string' ? { name: product.category } : product.category,
      colors: product.colors || [],
      sizes: product.sizes || [],
      stock: product.stock
    };

    addToCart(productType, defaultSize, defaultColor);
    router.push(`/checkout?buyNow=true&productId=${product.id}`);
  };

  return (
    <Link href={`/product/${product.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <img
          src={imageSrc}
          alt={product.name}
          className={styles.image}
          onError={(e) => {
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
          }}
        />
        {isOutOfStock && (
          <div className={styles.outOfStockBadge}>Out of Stock</div>
        )}
        <div className={styles.actions}>
          <div className={styles.quickActions}>
            <button 
              className={`${styles.actionBtn} ${styles.addCart}`}
              onClick={handleAddToCart}
              disabled={isAdding || isOutOfStock}
            >
              {isAdding ? 'Added!' : 'Add to Cart'}
            </button>
            <button 
              className={`${styles.actionBtn} ${styles.buyNow}`}
              onClick={handleBuyNow}
              disabled={isOutOfStock}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.price}>
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
