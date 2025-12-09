"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import CartItem from './CartItem';

export default function CartSidebar() {
  const router = useRouter();
  const { cart, isCartOpen, toggleCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    toggleCart();
    router.push('/select-table');
  };

  const handleLoginRedirect = () => {
    toggleCart();
    router.push('/auth/login');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={toggleCart}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-baristas-cream shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-6 border-b-2 border-baristas-beige bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-baristas-brown-dark">Your Cart ({cart.item_count})</h2>
            <button
              onClick={toggleCart}
              className="text-baristas-brown hover:text-baristas-brown-dark text-3xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-baristas-cream transition-colors"
              aria-label="Close cart"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 bg-baristas-cream">
          {cart.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-baristas-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-baristas-brown-dark font-semibold text-lg mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-600 mb-6">
                Add some delicious items to get started!
              </p>
              <button
                onClick={() => {
                  toggleCart();
                  router.push('/menu');
                }}
                className="btn-primary mx-auto"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer with totals */}
        {cart.items.length > 0 && (
          <div className="border-t-2 border-baristas-beige p-6 bg-baristas-brown-dark">
            <div className="bg-baristas-brown/50 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-bold text-lg mb-4">Order summary</h3>
              <div className="space-y-3 text-white">
                <div className="flex justify-between">
                  <span className="text-gray-300">Subtotal</span>
                  <span className="font-semibold">{cart.subtotal.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Tax (10%)</span>
                  <span className="font-semibold">{cart.tax.toFixed(2)} DH</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span>
                    <span className="font-semibold">-{cart.discount.toFixed(2)} DH</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t border-baristas-brown-light pt-3">
                  <span>Total</span>
                  <span>{cart.total.toFixed(2)} DH</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {isAuthenticated ? (
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-baristas-cream text-baristas-brown-dark font-bold rounded-xl hover:bg-white transition-colors text-lg"
                >
                  Continue as Guest
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-4 bg-baristas-cream text-baristas-brown-dark font-bold rounded-xl hover:bg-white transition-colors text-lg"
                  >
                    Continue as Guest
                  </button>
                  <button
                    onClick={handleLoginRedirect}
                    className="w-full py-3 bg-transparent border-2 border-baristas-cream text-baristas-cream font-semibold rounded-xl hover:bg-baristas-cream hover:text-baristas-brown-dark transition-colors"
                  >
                    Login / Create Account
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    Save your favorites and track your orders easily.
                  </p>
                </>
              )}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear your cart?')) {
                    clearCart();
                  }
                }}
                className="w-full py-2 text-sm text-red-400 hover:text-red-300 font-medium"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
