"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { CartContextType, Cart, CartItem } from '@/types/cart.types';
import { cartService } from '@/services/cart.service';

// Create the context
export const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
  storageKey?: string;
}

const EMPTY_CART: Cart = {
  items: [],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  item_count: 0,
};

export function CartProvider({ children, storageKey }: CartProviderProps) {
  // Always start with an empty cart so SSR and initial client render match.
  // localStorage is only read inside useEffect (client-only).
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Reload cart when the storage key changes (e.g. switching device sessions)
  useEffect(() => {
    const stored = cartService.getCart(storageKey);
    setCart(stored.items.length > 0 ? stored : EMPTY_CART);
    setIsCartOpen(false);
  }, [storageKey]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.items.length > 0) {
      cartService.saveCart(cart.items, storageKey);
    }
  }, [cart, storageKey]);

  const addToCart = useCallback((item: Omit<CartItem, 'id' | 'unit_price' | 'total_price'>) => {
    const unitPrice = cartService.calculateUnitPrice(item);
    const totalPrice = unitPrice * item.quantity;
    const id = cartService.generateCartItemId(item);

    setCart((prevCart) => {
      // Check if item with same configuration already exists
      const existingItemIndex = prevCart.items.findIndex((i) => i.id === id);

      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        newItems = [...prevCart.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + item.quantity,
          total_price: (newItems[existingItemIndex].quantity + item.quantity) * unitPrice,
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          ...item,
          id,
          unit_price: unitPrice,
          total_price: totalPrice,
        };
        newItems = [...prevCart.items, newItem];
      }

      return cartService.calculateCart(newItems);
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter((item) => item.id !== itemId);
      return cartService.calculateCart(newItems);
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((prevCart) => {
      const newItems = prevCart.items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            total_price: item.unit_price * quantity,
          };
        }
        return item;
      });

      return cartService.calculateCart(newItems);
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart(cartService.clearCart(storageKey));
  }, [storageKey]);

  const resetCart = useCallback(() => {
    setCart({
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      item_count: 0,
    });
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  const value: CartContextType = useMemo(
    () => ({
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      resetCart,
      isCartOpen,
      toggleCart,
      setIsCartOpen,
    }),
    [cart, addToCart, removeFromCart, updateQuantity, clearCart, resetCart, isCartOpen, toggleCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use the CartContext
export function useCart() {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
