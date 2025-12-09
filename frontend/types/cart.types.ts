// Cart related type definitions

import { MenuItem, MenuItemVariant, MenuItemAddon } from './menu.types';

export interface CartItemAddon {
  addon: MenuItemAddon;
  quantity: number;
}

export interface CartItem {
  id: string; // Unique ID for cart item (generated client-side)
  menuItem: MenuItem;
  variant?: MenuItemVariant;
  addons: CartItemAddon[];
  quantity: number;
  special_instructions?: string;
  unit_price: number; // Base price + variant + addons
  total_price: number; // unit_price * quantity
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  item_count: number;
}

export interface CartContextType {
  cart: Cart;
  addToCart: (item: Omit<CartItem, 'id' | 'unit_price' | 'total_price'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
}
