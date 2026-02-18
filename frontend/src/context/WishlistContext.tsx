'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, WishlistItem } from '@/lib/api';

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshWishlist();
  }, []);

  const refreshWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const wishlist = await api.getWishlist();
      setItems(wishlist);
    } catch (error) {
      console.error('Failed to fetch wishlist', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: number) => {
    await api.addToWishlist(productId);
    await refreshWishlist();
  };

  const removeFromWishlist = async (productId: number) => {
    await api.removeFromWishlist(productId);
    setItems(prev => prev.filter(item => item.product_id !== productId));
  };

  const isInWishlist = (productId: number) => {
    return items.some(item => item.product_id === productId);
  };

  return (
    <WishlistContext.Provider value={{ items, loading, addToWishlist, removeFromWishlist, isInWishlist, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
