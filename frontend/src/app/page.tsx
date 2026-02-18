'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Carousel, { CarouselItem } from '@/components/Carousel';
import styles from './page.module.css';

const categoryImages: Record<string, string> = {
  'Classic': 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80',
  'Embroidered': 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=600&q=80',
  'Artisan': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
  'Contemporary': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
  'Heritage': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&q=80',
};

const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    location: 'London, UK',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80',
    text: 'The quality of my Pashmina shawl is extraordinary. It feels incredibly soft and the craftsmanship is unmatched. I receive compliments every time I wear it.',
  },
  {
    id: 2,
    name: 'James Chen',
    location: 'San Francisco, USA',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    text: 'A truly luxurious experience. The attention to detail in every stitch is remarkable. This is not just a shawl, it\'s a piece of art.',
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    location: 'Madrid, Spain',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80',
    text: 'I\'ve been a customer for years and each piece exceeds my expectations. The warmth and elegance of Pashmiya is unmatched.',
  },
  {
    id: 4,
    name: 'Michael Thompson',
    location: 'Sydney, Australia',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
    text: 'Bought this as a gift for my wife and she absolutely loves it. The quality is exceptional and the delivery was seamless.',
  },
];

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideo, setCurrentVideo] = useState(0);

  const videos = ['/hero-video-2.mp4'];

  useEffect(() => {
    Promise.all([
      api.getProducts({ featured: true }),
      api.getCategories()
    ]).then(([productsData, categoriesData]) => {
      setProducts(productsData);
      setCategories(categoriesData || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleVideoEnded = () => {
    setCurrentVideo((prev) => (prev + 1) % videos.length);
  };

  const featuredProducts = products.slice(0, 8);
  const newArrivals = [...products].reverse().slice(0, 6);
  const bestSellers = products.slice(2, 10);

  if (loading) {
    return (
      <div className={styles.page}>
        <div style={{ padding: '200px 0', textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroImage}>
          <video
            key={currentVideo}
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
            className={styles.heroVideo}
            src={videos[currentVideo]}
          />
          <div className={styles.heroOverlay}></div>
        </div>
        <div className={styles.heroContent}>
          <h1>The Art of <br />Kashmiri Pashmina</h1>
          <p>Handwoven with centuries of tradition, each shawl is a masterpiece of exceptional craftsmanship.</p>
          <Link href="/shop" className={styles.cta}>Explore Collection</Link>
        </div>
      </section>

      {/* Categories Section - Carousel */}
      {categories.length > 0 && (
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <h2>Shop by Category</h2>
              <p>Explore our curated collections</p>
            </div>
            <Carousel itemWidth={280} gap={20}>
              {categories.map((cat) => (
                <CarouselItem key={cat.id} width={280}>
                  <Link
                    href={`/shop?category=${cat.id}`}
                    className={styles.categoryCard}
                  >
                    <img
                      src={cat.image || categoryImages[cat.name] || 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&q=80'}
                      alt={cat.name}
                    />
                    <div className={styles.categoryOverlay}>
                      <h3>{cat.name}</h3>
                      <span>Shop Now</span>
                    </div>
                  </Link>
              </CarouselItem>
            ))}
          </Carousel>
        </div>
      </section>
      )}

      {/* Featured Collection - Carousel */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Featured Collection</h2>
            <p>Discover our most cherished pieces</p>
          </div>
          <Carousel itemWidth={220} gap={16}>
            {featuredProducts.map((product) => (
              <CarouselItem key={product.id} width={220}>
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </Carousel>
          <div className={styles.viewAll}>
            <Link href="/shop" className={styles.viewAllLink}>View All Shawls</Link>
          </div>
        </div>
      </section>

      {/* New Arrivals - Carousel */}
      {/*
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>New Arrivals</h2>
            <p>Fresh additions to our collection</p>
          </div>
          <Carousel itemWidth={220} gap={16}>
            {newArrivals.map((product) => (
              <CarouselItem key={product.id} width={220}>
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </Carousel>
        </div>
      </section>
      */}

      {/* Best Sellers - Carousel */}
      {/*
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Best Sellers</h2>
            <p>Most loved by our customers</p>
          </div>
          <Carousel itemWidth={220} gap={16}>
            {bestSellers.map((product) => (
              <CarouselItem key={product.id} width={220}>
                <ProductCard product={product} />
              </CarouselItem>
            ))}
          </Carousel>
        </div>
      </section>
      */}

      {/* Story Section 1 */}
      <section className={styles.storySection}>
        <div className={styles.container}>
          <div className={styles.storyContent}>
            <h2>A Legacy of Craftsmanship</h2>
            <p>
              For generations, our artisans in Kashmir have perfected the art of creating
              the world&apos;s finest Pashmina shawls. Each piece requires months of meticulous
              handwork, from the careful harvesting of fine undercoat fibers to the intricate
              weaving that creates our signature softness.
            </p>
            <Link href="/about" className={styles.storyLink}>Learn More</Link>
          </div>
          <div className={styles.storyImage}>
            <img
              src="https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=800&q=80"
              alt="Kashmiri artisan at work"
            />
          </div>
        </div>
      </section>

      {/* Testimonials - Carousel */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>What Our Customers Say</h2>
            <p>Stories from satisfied patrons</p>
          </div>
          <Carousel itemWidth={400} gap={24}>
            {testimonials.map((testimonial) => (
              <CarouselItem key={testimonial.id} width={400}>
                <div className={styles.testimonialCard}>
                  <div className={styles.testimonialHeader}>
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className={styles.testimonialImage}
                    />
                    <div>
                      <h4>{testimonial.name}</h4>
                      <span>{testimonial.location}</span>
                    </div>
                  </div>
                  <p className={styles.testimonialText}>"{testimonial.text}"</p>
                </div>
              </CarouselItem>
            ))}
          </Carousel>
        </div>
      </section>

      {/* Story Section 2 */}
      <section className={`${styles.storySection} ${styles.storySectionAlt}`}>
        <div className={styles.container}>
          <div className={styles.storyImage}>
            <img
              src="https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80"
              alt="Pashmina craftsmanship"
            />
          </div>
          <div className={styles.storyContent}>
            <h2>Uncompromising Quality</h2>
            <p>
              We source only the finest Pashmina fibers from the high-altitude regions of Ladakh,
              where the rare Changthangi goats produce the world&apos;s softest wool. Every shawl
              undergoes rigorous quality checks to ensure it meets our exacting standards.
            </p>
            <Link href="/about" className={styles.storyLink}>Our Process</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
