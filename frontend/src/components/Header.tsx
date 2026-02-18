'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useState, useEffect, useRef } from 'react';
import { api, Product, Category, Catalogue } from '@/lib/api';
import styles from './Header.module.css';

const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E"

interface SearchResult {
  type: 'product' | 'category' | 'page' | 'collection';
  title: string;
  subtitle?: string;
  image?: string;
  link: string;
}

export default function Header() {
  const { totalItems } = useCart();
  const { currency, setCurrency, currencies } = useCurrency();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchModalOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchModalOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    const searchContent = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      const results: SearchResult[] = [];

      try {
        const products = await api.searchProducts(searchQuery) as Product[];
        if (products && products.length > 0) {
          products.slice(0, 5).forEach((product: Product) => {
            results.push({
              type: 'product',
              title: product.name,
              subtitle: product.category?.name || 'Pashmina Product',
              image: product.image,
              link: `/product/${product.id}`,
            });
          });
        }

        const categories = await api.getCategories() as Category[];
        if (categories) {
          const matchingCategories = categories.filter((c: Category) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          matchingCategories.slice(0, 3).forEach((category: Category) => {
            results.push({
              type: 'category',
              title: category.name,
              subtitle: 'Category',
              image: category.image,
              link: `/shop?category=${category.id}`,
            });
          });
        }

        const catalogues = await api.getCatalogues({ search: searchQuery }) as Catalogue[];
        if (catalogues && catalogues.length > 0) {
          catalogues.slice(0, 3).forEach((catalogue: Catalogue) => {
            results.push({
              type: 'collection',
              title: catalogue.name,
              subtitle: 'Collection',
              image: catalogue.image,
              link: `/catalogue/${catalogue.id}`,
            });
          });
        }

        const staticPages = [
          { title: 'Shop', link: '/shop', keywords: ['shop', 'products', 'buy', 'store', 'pashmina', 'shawl', 'scarf'] },
          { title: 'About', link: '/about', keywords: ['about', 'story', 'us', 'company', 'craft', 'handmade'] },
          { title: 'Cart', link: '/cart', keywords: ['cart', 'bag', 'checkout', 'order'] },
        ];

        const query = searchQuery.toLowerCase();
        staticPages.forEach(page => {
          if (page.keywords.some(k => k.includes(query) || query.includes(k))) {
            results.push({
              type: 'page',
              title: page.title,
              subtitle: 'Page',
              link: page.link,
            });
          }
        });

      } catch (error) {
        console.error('Search error:', error);
      }

      setSearchResults(results);
      setSearching(false);
    };

    const debounce = setTimeout(searchContent, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearchResultClick = (result: SearchResult) => {
    setSearchModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    router.push(result.link);
  };

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    setCurrencyDropdownOpen(false);
  };

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''} ${isHomePage && !scrolled ? styles.heroLight : ''}`}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            PASHMIYA
          </Link>
          
          <button 
            className={styles.menuButton}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`${styles.menuIcon} ${menuOpen ? styles.open : ''}`}></span>
          </button>

          <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
            <Link href="/shop" className={`${styles.navLink} ${pathname === '/shop' ? styles.active : ''}`} onClick={() => setMenuOpen(false)}>
              Shop
            </Link>
            <Link href="/catalogue" className={`${styles.navLink} ${pathname?.startsWith('/catalogue') ? styles.active : ''}`} onClick={() => setMenuOpen(false)}>
              Collections
            </Link>
            <Link href="/about" className={`${styles.navLink} ${pathname === '/about' ? styles.active : ''}`} onClick={() => setMenuOpen(false)}>
              About
            </Link>
            
            <button 
              onClick={() => setSearchModalOpen(true)}
              className={styles.searchButton}
            >
              Search
            </button>

            <div ref={currencyRef} className={styles.currencyContainer}>
              <button 
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className={styles.currencyButton}
              >
                <span>{currency.code}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              
              {currencyDropdownOpen && (
                <div className={styles.currencyDropdown}>
                  {currencies.map(c => (
                    <button
                      key={c.code}
                      onClick={() => handleCurrencyChange(c.code)}
                      className={`${styles.currencyOption} ${currency.code === c.code ? styles.active : ''}`}
                    >
                      <span className={styles.currencyCode}>{c.code}</span>
                      <span className={styles.currencySymbol}>{c.symbol}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href="/cart" className={styles.cartLink} onClick={() => setMenuOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {totalItems > 0 && <span className={styles.cartCount}>{totalItems}</span>}
            </Link>
          </nav>
        </div>
      </header>

      {searchModalOpen && (
        <div className={styles.searchOverlay} onClick={() => setSearchModalOpen(false)}>
          <div className={styles.searchModal} onClick={e => e.stopPropagation()}>
            <div className={styles.searchHeader}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, collections, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button 
                onClick={() => setSearchModalOpen(false)}
                className={styles.closeButton}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.searchBody}>
              {searching ? (
                <div className={styles.searchLoading}>
                  <div className={styles.spinner}></div>
                  <p>Searching...</p>
                </div>
              ) : searchQuery.length < 2 ? (
                <div className={styles.searchHint}>
                  <p>Type at least 2 characters to search</p>
                  <div className={styles.searchSuggestions}>
                    <h4>Popular searches</h4>
                    <div className={styles.suggestionTags}>
                      <button onClick={() => setSearchQuery('Pashmina')}>Pashmina</button>
                      <button onClick={() => setSearchQuery('Shawl')}>Shawl</button>
                      <button onClick={() => setSearchQuery('Scarf')}>Scarf</button>
                      <button onClick={() => setSearchQuery('Wool')}>Wool</button>
                      <button onClick={() => setSearchQuery('Cashmere')}>Cashmere</button>
                    </div>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className={styles.noResults}>
                  <p>No results found for "{searchQuery}"</p>
                  <p>Try different keywords or browse our categories</p>
                </div>
              ) : (
                <div className={styles.searchResults}>
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultClick(result)}
                      className={styles.searchResultItem}
                    >
                      {result.image && (
                        <div className={styles.resultImage}>
                          <img 
                            src={result.image} 
                            alt={result.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                            }}
                          />
                        </div>
                      )}
                      <div className={styles.resultInfo}>
                        <span className={styles.resultType}>{result.type}</span>
                        <h4>{result.title}</h4>
                        {result.subtitle && <p>{result.subtitle}</p>}
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
