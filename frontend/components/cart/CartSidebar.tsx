"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useTable } from '@/contexts/TableContext';
import CartItem from './CartItem';
import { X, ShoppingBag, ShoppingCart, ChevronRight, Trash2, LogIn, MapPin } from 'lucide-react';

export default function CartSidebar() {
  const router = useRouter();
  const { cart, isCartOpen, toggleCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { selectedTable } = useTable();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    toggleCart();
    if (isAuthenticated) {
      // Authenticated: go straight to checkout if table set, else to settings
      router.push(selectedTable ? '/checkout' : '/settings');
    } else {
      // Guest: go through select-table flow
      router.push('/select-table');
    }
  };

  const handleLoginRedirect = () => {
    toggleCart();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={toggleCart}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className="fixed right-0 top-0 h-full w-full max-w-sm bg-baristas-cream shadow-2xl z-50 flex flex-col animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        {/* Header */}
        <div className="p-5 border-b border-baristas-beige bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-baristas-brown-dark" />
            <h2 id="cart-title" className="text-lg font-bold text-baristas-brown-dark">
              Your Cart
              {cart.item_count > 0 && (
                <span className="ml-2 text-xs bg-baristas-brown-dark text-baristas-cream px-2 py-0.5 rounded-full font-semibold">
                  {cart.item_count}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={toggleCart}
            className="text-gray-400 hover:text-baristas-brown-dark w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" role="region" aria-label="Cart items">
          {cart.items.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center" role="status">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm">
                <ShoppingCart className="w-10 h-10 text-baristas-brown/40" />
              </div>
              <p className="text-baristas-brown-dark font-bold text-base mb-1">Your cart is empty</p>
              <p className="text-sm text-gray-400 mb-6">Add some delicious items to get started!</p>
              <button
                onClick={() => { toggleCart(); router.push('/menu'); }}
                className="bg-baristas-brown-dark text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-baristas-brown transition-colors"
                aria-label="Browse menu to add items"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <ul role="list" className="space-y-3">
              {cart.items.map((item) => (
                <li key={item.id}>
                  <CartItem item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-baristas-beige bg-baristas-brown-dark p-5 space-y-4">
            {/* Order summary */}
            <div className="bg-baristas-brown/40 rounded-2xl p-4 space-y-2" aria-labelledby="order-summary-heading">
              <h3 id="order-summary-heading" className="text-white font-bold text-sm mb-3">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white font-semibold">{cart.subtotal.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Tax (10%)</span>
                <span className="text-white font-semibold">{cart.tax.toFixed(2)} DH</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount</span>
                  <span className="font-semibold">-{cart.discount.toFixed(2)} DH</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-white/15 pt-2 mt-2">
                <span className="text-white">Total</span>
                <span className="text-baristas-cream">{cart.total.toFixed(2)} DH</span>
              </div>
            </div>

            {/* Table indicator for authenticated users */}
            {isAuthenticated && (
              <button
                onClick={() => { toggleCart(); router.push('/settings'); }}
                className="w-full py-2.5 rounded-xl bg-baristas-brown/30 border border-baristas-cream/20 text-sm flex items-center justify-center gap-2 text-baristas-cream/80 hover:bg-baristas-brown/50 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {selectedTable
                  ? <span>Table <span className="font-bold text-baristas-cream">{selectedTable.number}</span> · Change</span>
                  : <span className="text-yellow-300 font-medium">No table set — tap to configure</span>
                }
              </button>
            )}

            {/* Action buttons */}
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 bg-baristas-cream text-baristas-brown-dark font-bold rounded-xl hover:bg-white transition-colors text-sm flex items-center justify-center gap-2 shadow-md"
              aria-label="Continue to checkout"
            >
              {isAuthenticated
                ? selectedTable ? 'Place Order' : 'Set Table & Order'
                : 'Continue as Guest'
              }
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isAuthenticated && (
              <button
                onClick={handleLoginRedirect}
                className="w-full py-3 bg-transparent border border-baristas-cream/30 text-baristas-cream/80 font-semibold rounded-xl hover:bg-white/10 hover:text-baristas-cream transition-all text-sm flex items-center justify-center gap-2"
                aria-label="Login or create account"
              >
                <LogIn className="w-4 h-4" />
                Login / Create Account
              </button>
            )}

            <button
              onClick={() => {
                if (confirm('Clear your entire cart?')) clearCart();
              }}
              className="w-full py-2 text-xs text-red-400/70 hover:text-red-400 font-medium flex items-center justify-center gap-1.5 transition-colors"
              aria-label={`Clear cart with ${cart.item_count} items`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Cart
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
