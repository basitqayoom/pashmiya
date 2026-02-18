'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProductType {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category?: { name: string };
  colors: string[];
  sizes: string[];
  stock?: number;
}

export interface CartItem {
  product: ProductType;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProductType, size: string, color: string) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export { CartContext };

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const savedCart = localStorage.getItem('pashmina-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('pashmina-cart', JSON.stringify(items));
    }
  }, [items, mounted]);

  const addToCart = (product: ProductType, size: string, color: string) => {
    setItems(prev => {
      const existingItem = prev.find(
        item => item.product.id === product.id && 
        item.selectedSize === size && 
        item.selectedColor === color
      );
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        const maxStock = product.stock || Infinity;
        
        if (newQuantity > maxStock) {
          return prev;
        }
        
        return prev.map(item =>
          item.product.id === product.id && 
          item.selectedSize === size && 
          item.selectedColor === color
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      
      return [...prev, { product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
  };

  const removeFromCart = (productId: number) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const item = items.find(i => i.product.id === productId);
    if (!item) return;
    
    const maxStock = item.product.stock || Infinity;
    
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    if (quantity > maxStock) {
      return;
    }
    
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, maxStock) }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
