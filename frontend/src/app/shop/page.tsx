'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, Product, Category, FilterOptions, getColorHex } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import CustomSelect from '@/components/CustomSelect';
import { useCurrency } from '@/context/CurrencyContext';
import styles from './page.module.css';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

const PRODUCTS_PER_PAGE = 12;

function ShopContent() {
  const searchParams = useSearchParams();
  const { currency, formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [priceInput, setPriceInput] = useState<[number, number]>([0, 2000]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getProducts(),
      api.getCategories(),
      api.getFilterOptions()
    ]).then(([productsData, categoriesData, filtersData]) => {
      setProducts(productsData);
      setCategories(categoriesData || []);
      setFilterOptions(filtersData);
      
      if (filtersData) {
        setPriceRange([Math.floor(filtersData.min_price), Math.ceil(filtersData.max_price)]);
        setPriceInput([Math.floor(filtersData.min_price), Math.ceil(filtersData.max_price)]);
      }
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  // Read category from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categories.length > 0) {
      const matchingCategory = categories.find(c => 
        String(c.id) === categoryParam || 
        c.name.toLowerCase() === categoryParam.toLowerCase() ||
        c.slug === categoryParam.toLowerCase()
      );
      if (matchingCategory) {
        setSelectedCategory(String(matchingCategory.id));
      } else {
        setSelectedCategory(categoryParam);
      }
    }
  }, [searchParams, categories]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory) {
      result = result.filter(p => p.category_id === parseInt(selectedCategory) || p.category?.id === parseInt(selectedCategory));
    }

    if (selectedColor) {
      result = result.filter(p => p.colors && p.colors.includes(selectedColor));
    }

    result = result.filter(p => p.price >= priceInput[0] && p.price <= priceInput[1]);

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [products, selectedCategory, selectedColor, priceInput, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedColor, priceInput, sortBy]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedColor('');
    if (filterOptions) {
      setPriceInput([Math.floor(filterOptions.min_price), Math.ceil(filterOptions.max_price)]);
    }
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory || selectedColor || 
    priceInput[0] !== priceRange[0] || priceInput[1] !== priceRange[1];

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' },
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: String(cat.id), label: cat.name })),
  ];

  const colorOptions = [
    { value: '', label: 'All Colors' },
    ...(filterOptions?.colors.map(color => ({
      value: color,
      label: color,
      color: getColorHex(color),
    })) || []),
  ];

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <div className={styles.container}>
          <h1>Shop with US</h1>
          <p>Handwoven Kashmiri Pashmina shawls of exceptional quality</p>
        </div>
      </section>

      <section className={styles.shop}>
        <div className={styles.container}>
          {/* Categories Showcase */}
          {categories.length > 0 && (
            <div className={styles.categoriesShowcase}>
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  href="/shop"
                  className={`${styles.categoryCard} ${selectedCategory === String(cat.id) ? styles.categoryActive : ''}`}
                  onClick={() => setSelectedCategory(String(cat.id))}
                >
                  <div className={styles.categoryImage}>
                    <img 
                      src={cat.image || PLACEHOLDER_IMAGE} 
                      alt={cat.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                      }}
                    />
                  </div>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          )}

          <button 
            className={styles.filterToggle}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14h14M1 10h14"/>
            </svg>
            Filters
            {hasActiveFilters && <span className={styles.filterBadge}>{[selectedCategory ? 1 : 0, selectedColor ? 1 : 0].reduce((a, b) => a + b, 0)}</span>}
          </button>

          <div className={styles.mainContent}>
            <aside className={`${styles.sidebar} ${showFilters ? styles.sidebarOpen : ''}`}>
              <div className={styles.filterSection}>
                <div className={styles.filterHeader}>
                  <h3>Filters</h3>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className={styles.clearFilters}>
                      Clear all
                    </button>
                  )}
                </div>

                <div className={styles.filterGroup}>
                  <label>Sort by</label>
                  <CustomSelect
                    options={sortOptions}
                    value={sortBy}
                    onChange={(value) => setSortBy(value as SortOption)}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label>Category</label>
                  <CustomSelect
                    options={categoryOptions}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    placeholder="All Categories"
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label>Color</label>
                  <CustomSelect
                    options={colorOptions}
                    value={selectedColor}
                    onChange={setSelectedColor}
                    placeholder="All Colors"
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label>Price Range ({currency.symbol}{Math.round(priceInput[0] * currency.rate)} - {currency.symbol}{Math.round(priceInput[1] * currency.rate)})</label>
                  <div className={styles.rangeContainer}>
                    <div className={styles.rangeTrack} style={{
                      left: `${((priceInput[0] - priceRange[0]) / (priceRange[1] - priceRange[0])) * 100}%`,
                      right: `${100 - ((priceInput[1] - priceRange[0]) / (priceRange[1] - priceRange[0])) * 100}%`
                    }} />
                    <input
                      type="range"
                      min={priceRange[0]}
                      max={priceRange[1]}
                      value={priceInput[0]}
                      onChange={(e) => setPriceInput([Math.min(Number(e.target.value), priceInput[1] - 10), priceInput[1]])}
                      className={styles.rangeSlider}
                    />
                    <input
                      type="range"
                      min={priceRange[0]}
                      max={priceRange[1]}
                      value={priceInput[1]}
                      onChange={(e) => setPriceInput([priceInput[0], Math.max(Number(e.target.value), priceInput[0] + 10)])}
                      className={styles.rangeSlider}
                    />
                  </div>
                  <div className={styles.priceLabels}>
                    <span>{currency.symbol}{Math.round(priceInput[0] * currency.rate)}</span>
                    <span>{currency.symbol}{Math.round(priceInput[1] * currency.rate)}</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className={styles.content}>
              {loading ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Loading products...</p>
                </div>
              ) : (
                <>
                  <div className={styles.resultsInfo}>
                    <p>Showing {paginatedProducts.length} of {filteredProducts.length} products</p>
                  </div>
                  
                  {paginatedProducts.length > 0 ? (
                    <div className={styles.grid}>
                      {paginatedProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className={styles.noResults}>
                      <p>No products match your filters.</p>
                      <button onClick={clearFilters} className={styles.clearFiltersBtn}>
                        Clear Filters
                      </button>
                    </div>
                  )}

                  {totalPages > 1 && (
                    <div className={styles.pagination}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={styles.pageBtn}
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        if (
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className={styles.ellipsis}>...</span>;
                        }
                        return null;
                      })}

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={styles.pageBtn}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <section className={styles.header}>
          <div className={styles.container}>
            <h1>Shop with US</h1>
            <p>Handwoven Kashmiri Pashmina shawls of exceptional quality</p>
          </div>
        </section>
        <section className={styles.shop}>
          <div className={styles.container}>
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading products...</p>
            </div>
          </div>
        </section>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
