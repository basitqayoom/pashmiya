'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { api, Category } from '@/lib/api';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.getCategories()
      .then((cats: Category[]) => {
        const activeCats = cats.filter((cat: Category) => cat.is_active !== false);
        setCategories(activeCats.slice(0, 6));
      })
      .catch(console.error);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <h3 className={styles.logo}>PASHMIYA</h3>
            <p className={styles.tagline}>
              Handwoven Kashmiri Pashmina shawls, crafted with centuries of tradition.
            </p>
          </div>

          <div className={styles.links}>
            <h4>Shop</h4>
            <Link href="/shop">All Shawls</Link>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/shop?category=${cat.id}`}>
                {cat.name}
              </Link>
            ))}
          </div>

          <div className={styles.links}>
            <h4>Company</h4>
            <Link href="/about#story">Our Story</Link>
            <Link href="/about#craftsmanship">Craftsmanship</Link>
            <Link href="/about#sustainability">Sustainability</Link>
          </div>

          <div className={styles.newsletter}>
            <h4>Newsletter</h4>
            <p>Subscribe for exclusive updates and early access to new collections.</p>
            {subscribed ? (
              <p className={styles.success}>Thank you for subscribing!</p>
            ) : (
              <form onSubmit={handleSubscribe} className={styles.form}>
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.input}
                />
                <button type="submit" className={styles.button}>Subscribe</button>
              </form>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; 2026 Pashmiya. All rights reserved.</p>
          <div className={styles.social}>
            <a href="#" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" aria-label="Pinterest">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4" />
                <path d="M9 18l1-4" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
