// Cart related type definitions

import { MenuItem, MenuItemVariant, MenuItemAddon, ComboChoice } from './menu.types';

export interface CartItemAddon {
  addon: MenuItemAddon;
  quantity: number;
}

export interface CartComboSelection {
  combo_id: number;          // pos.combo id (group id)
  combo_line_id: number;     // pos.combo.line id (the specific choice)
  product_id: number | null; // Odoo product.product id of the chosen item
  label: string;             // Display name of the choice
  price_extra: number;       // Extra price for this choice
}

export interface CartItem {
  id: string; // Unique ID for cart item (generated client-side)
  menuItem: MenuItem;
  variant?: MenuItemVariant;
  addons: CartItemAddon[];
  combo_selections?: CartComboSelection[];
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
  resetCart: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  setIsCartOpen: (open: boolean) => void;
}
