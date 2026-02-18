'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, Catalogue } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import styles from './page.module.css';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"

export default function CatalogueDetail() {
  const params = useParams();
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      api.getCatalogue(String(params.id))
        .then(data => setCatalogue(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!catalogue) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <h2>Collection Not Found</h2>
          <p>This collection may have been removed or doesn't exist.</p>
          <Link href="/catalogue" className={styles.backLink}>
            View All Collections
          </Link>
        </div>
      </div>
    );
  }

  const products = catalogue.products || [];

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/catalogue">Collections</Link>
            <span>/</span>
            <span>{catalogue.name}</span>
          </nav>
          <div className={styles.headerContent}>
            {catalogue.image && (
              <div className={styles.headerImage}>
                <img 
                  src={catalogue.image} 
                  alt={catalogue.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                  }}
                />
              </div>
            )}
            <div className={styles.headerText}>
              <h1>{catalogue.name}</h1>
              {catalogue.description && (
                <p>{catalogue.description}</p>
              )}
              <span className={styles.productCount}>
                {products.length} {products.length === 1 ? 'product' : 'products'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.products}>
        <div className={styles.container}>
          {products.length === 0 ? (
            <div className={styles.empty}>
              <p>No products in this collection yet.</p>
              <Link href="/shop" className={styles.shopLink}>
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
