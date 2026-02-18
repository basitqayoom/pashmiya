'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface PageContent {
  id: number;
  page: string;
  section: string;
  title: string;
  content: string;
  image: string;
}

export default function About() {
  const [contents, setContents] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getContent('about')
      .then(data => setContents(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Handle scroll to hash on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    }
  }, [loading]);

  const getContent = (section: string) => {
    return contents.find(c => c.section === section);
  };

  const heroContent = getContent('hero');
  const storyContent = getContent('story');
  const craftContent = getContent('craftsmanship');
  const sustainabilityContent = getContent('sustainability');

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1>{heroContent?.title || 'Our Story'}</h1>
          <p>{heroContent?.content || 'A legacy of Kashmiri craftsmanship'}</p>
        </div>
      </section>

      {/* Section 1 - Story */}
      <section id="story" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.imageBlock}>
              <img
                src={heroContent?.image || "https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=800&q=80"}
                alt="Kashmiri artisan"
              />
            </div>
            <div className={styles.textBlock}>
              <h2>{storyContent?.title || 'Centuries of Tradition'}</h2>
              <p>
                Our journey began in the valleys of Kashmir, where the art of Pashmina weaving
                has been passed down through generations for over 500 years. Each shawl we create
                carries the wisdom and skill of master artisans who have dedicated their lives to
                this sacred craft.
              </p>
              <p>
                The word &quot;Pashmina&quot; comes from the Persian word &quot;pashm&quot;, meaning soft gold.
                Our shawls are made from the fine undercoat of Changthangi goats that roam the
                high altitudes of the Himalayas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Craftsmanship */}
      <section id="craftsmanship" className={styles.sectionAlt}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.imageBlock}>
              <img
                src="https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80"
                alt="Pashmina craftsmanship"
              />
            </div>
            <div className={styles.textBlock}>
              <h2>{craftContent?.title || 'Centuries of Excellence'}</h2>
              <p>
                Pashmina weaving dates back to the 15th century in Kashmir, with techniques
                that have remained virtually unchanged through the ages. The art is passed from
                father to son, with families dedicating their lives to perfecting this delicate craft.
              </p>
              <p>
                Our master artisans have spent decades—some even a lifetime—honning their skills,
                creating pieces that are not merely products but heirlooms to be treasured for
                generations. Each shawl carries within it the soul of Kashmir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Sustainability */}
      <section id="sustainability" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid}>
            <div className={styles.textBlock}>
              <h2>{sustainabilityContent?.title || 'Sustainable Luxury'}</h2>
              <p>
                We are committed to preserving both the environment and the traditional livelihoods
                of Kashmiri artisans. Our Pashmina is sourced responsibly from Changthangi goats
                in their natural Himalayan habitat, ensuring no harm comes to these magnificent animals.
              </p>
              <p>
                By supporting local artisan communities and using eco-friendly, chemical-free dyeing
                processes, we ensure that every shawl not only brings warmth to its wearer but also
                sustains the fragile ecosystem and cultural heritage of Kashmir.
              </p>
            </div>
            <div className={styles.imageBlock}>
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80"
                alt="Sustainable Pashmina"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 - Authenticity & GI Certification */}
      <section id="authenticity" className={styles.sectionAlt}>
        <div className={styles.container}>
          <div className={styles.authenticitySection}>
            <h2>Authenticity & Certification</h2>
            <p className={styles.authenticityIntro}>
              Every piece in our collection is certified authentic, ensuring you receive only genuine 
              Kashmiri Pashmina of the highest quality.
            </p>
            
            <div className={styles.authenticityGrid}>
              <div className={styles.authenticityCard}>
                <div className={styles.authIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
                <h3>GI Tag Certification</h3>
                <p>
                  Our Pashmina products are certified with the prestigious Geographical Indication (GI) Label, 
                  which certifies the fiber as a mark of distinction in global markets. This认证 guarantees 
                  that your shawl originates from Kashmir and meets the traditional craftsmanship standards.
                </p>
              </div>

              <div className={styles.authenticityCard}>
                <div className={styles.authIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  </svg>
                </div>
                <h3>Lab Testing & Certification</h3>
                <p>
                  Every product is tested at the Pashmina Testing and Quality Certification Centre (PTQCC) 
                  at Craft Development Institute, Srinagar. Using high-resolution digital microscopy, we 
                  verify fiber authenticity—ensuring only 100% pure Pashmina from Changthangi goats.
                </p>
              </div>

              <div className={styles.authenticityCard}>
                <div className={styles.authIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>
                <h3>Pure Pashmina Guarantee</h3>
                <p>
                  Authentic Pashmina fibers measure 12-16 microns in diameter—significantly finer than 
                  standard cashmere. Our products are hand-spun and hand-woven by master artisans in 
                  Kashmir, using techniques passed down through generations for over 500 years.
                </p>
              </div>

              <div className={styles.authenticityCard}>
                <div className={styles.authIcon}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <path d="M9 15l2 2 4-4"/>
                  </svg>
                </div>
                <h3>Certificate of Authenticity</h3>
                <p>
                  Each purchase includes a certificate of authenticity with a unique traceable ID tag, 
                  enabling seamless verification in national and international markets. Every shawl comes 
                  with documentation certifying its origin and quality.
                </p>
              </div>
            </div>

            <div className={styles.authenticityTests}>
              <h3>How to Verify Your Pashmina</h3>
              <div className={styles.testsList}>
                <div className={styles.testItem}>
                  <span className={styles.testNumber}>1</span>
                  <div>
                    <strong>Burn Test:</strong> Take a small thread from the fringe and burn it. 
                    Genuine Pashmina turns to ash with no chemical smell. Synthetic fibers melt or form 
                    hard beads.
                  </div>
                </div>
                <div className={styles.testItem}>
                  <span className={styles.testNumber}>2</span>
                  <div>
                    <strong>Light Test:</strong> Hold the shawl against light. Authentic Pashmina 
                    shows even weaving with slight irregularities—proof of handwork.
                  </div>
                </div>
                <div className={styles.testItem}>
                  <span className={styles.testNumber}>3</span>
                  <div>
                    <strong>Touch Test:</strong> Real Pashmina feels impossibly soft and warm instantly. 
                    It gets softer with each wear.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsSection}>
        <div className={styles.container}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>500+</span>
              <span className={styles.statLabel}>Years of tradition</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>100%</span>
              <span className={styles.statLabel}>Handwoven</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>50+</span>
              <span className={styles.statLabel}>Master artisans</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2>Experience the Elegance</h2>
          <p>Explore our collection of authentic Kashmiri Pashmina shawls</p>
          <Link href="/shop" className={styles.ctaButton}>View Collection</Link>
        </div>
      </section>
    </div>
  );
}
