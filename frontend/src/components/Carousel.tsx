'use client';

import { useRef, ReactNode } from 'react';
import styles from './Carousel.module.css';

interface CarouselProps {
  children: ReactNode;
  itemWidth?: number;
  gap?: number;
}

export default function Carousel({ children, itemWidth = 320, gap = 24 }: CarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: number) => {
    if (carouselRef.current) {
      const scrollAmount = direction * (itemWidth + gap);
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.carousel}>
      <button
        className={`${styles.navButton} ${styles.prev}`}
        onClick={() => scroll(-1)}
        aria-label="Previous"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      
      <div 
        className={styles.carouselInner} 
        ref={carouselRef}
        style={{ 
          scrollSnapType: 'x mandatory',
          gap: `${gap}px`
        }}
      >
        {children}
      </div>
      
      <button
        className={`${styles.navButton} ${styles.next}`}
        onClick={() => scroll(1)}
        aria-label="Next"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}

export function CarouselItem({ 
  children, 
  width = 320 
}: { 
  children: ReactNode; 
  width?: number;
}) {
  return (
    <div 
      className={styles.carouselItem}
      style={{ 
        minWidth: `${width}px`,
        scrollSnapAlign: 'center'
      }}
    >
      {children}
    </div>
  );
}
