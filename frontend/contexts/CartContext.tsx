"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { CartContextType, Cart, CartItem } from '@/types/cart.types';
import { cartService } from '@/services/cart.service';

// Create the context
export const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<Cart>(cartService.getCart());
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setCart(cartService.getCart());
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.items.length > 0) {
      cartService.saveCart(cart.items);
    }
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'id' | 'unit_price' | 'total_price'>) => {
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
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => {
      const newItems = prevCart.items.filter((item) => item.id !== itemId);
      return cartService.calculateCart(newItems);
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
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
  };

  const clearCart = () => {
    setCart(cartService.clearCart());
  };

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
