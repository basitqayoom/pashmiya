'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, Catalogue } from '@/lib/api';
import styles from './page.module.css';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"

export default function Catalogues() {
  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCatalogues({ status: 'true' })
      .then(data => setCatalogues(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className={styles.container}>
          <h1>Our Collections</h1>
          <p>Explore curated collections of handwoven Kashmiri Pashmina</p>
        </div>
      </section>

      <section className={styles.catalogues}>
        <div className={styles.container}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading collections...</p>
            </div>
          ) : catalogues.length === 0 ? (
            <div className={styles.empty}>
              <p>No collections available at the moment.</p>
              <Link href="/shop" className={styles.shopLink}>
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {catalogues.map(catalogue => (
                <Link
                  key={catalogue.id}
                  href={`/catalogue/${catalogue.id}`}
                  className={styles.card}
                >
                  <div className={styles.cardImage}>
                    {catalogue.image ? (
                      <img 
                        src={catalogue.image} 
                        alt={catalogue.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className={styles.placeholder}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <h3>{catalogue.name}</h3>
                    {catalogue.description && (
                      <p className={styles.description}>{catalogue.description}</p>
                    )}
                    <span className={styles.productCount}>
                      {catalogue.products?.length || 0} products
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
