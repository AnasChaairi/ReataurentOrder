import { CartItem, Cart } from '@/types/cart.types';

const CART_STORAGE_KEY = 'restaurant_cart';
const TAX_RATE = 0.10; // 10% tax

class CartService {
  /**
   * Get cart from localStorage
   */
  getCart(): Cart {
    if (typeof window === 'undefined') {
      return this.getEmptyCart();
    }

    try {
      const cartJson = localStorage.getItem(CART_STORAGE_KEY);
      if (!cartJson) {
        return this.getEmptyCart();
      }

      const items: CartItem[] = JSON.parse(cartJson);
      return this.calculateCart(items);
    } catch (error) {
      console.error('Error loading cart:', error);
      return this.getEmptyCart();
    }
  }

  /**
   * Save cart to localStorage
   */
  saveCart(items: CartItem[]): Cart {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
    return this.calculateCart(items);
  }

  /**
   * Calculate cart totals
   */
  calculateCart(items: CartItem[]): Cart {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * TAX_RATE;
    const discount = 0; // TODO: Implement discount logic
    const total = subtotal + tax - discount;
    const item_count = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      items,
      subtotal,
      tax,
      discount,
      total,
      item_count,
    };
  }

  /**
   * Calculate unit price for a cart item
   */
  calculateUnitPrice(item: Omit<CartItem, 'id' | 'unit_price' | 'total_price'>): number {
    let price = item.menuItem.price;

    // Add variant price
    if (item.variant) {
      price += item.variant.price_modifier;
    }

    // Add addons prices
    const addonsPrice = item.addons.reduce(
      (sum, addon) => sum + addon.addon.price * addon.quantity,
      0
    );
    price += addonsPrice;

    return price;
  }

  /**
   * Generate unique ID for cart item
   */
  generateCartItemId(item: Omit<CartItem, 'id' | 'unit_price' | 'total_price'>): string {
    const variantId = item.variant?.id || 'no-variant';
    const addonIds = item.addons
      .map((a) => `${a.addon.id}x${a.quantity}`)
      .sort()
      .join('-');
    const comboIds = (item.combo_selections ?? [])
      .map((c) => `${c.combo_id}:${c.combo_line_id}`)
      .sort()
      .join('-');
    const instructions = item.special_instructions || 'no-instructions';

    return `${item.menuItem.id}-${variantId}-${addonIds}-${comboIds}-${instructions}`;
  }

  /**
   * Clear cart
   */
  clearCart(): Cart {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    return this.getEmptyCart();
  }

  /**
   * Get empty cart
   */
  private getEmptyCart(): Cart {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      item_count: 0,
    };
  }
}

export const cartService = new CartService();
