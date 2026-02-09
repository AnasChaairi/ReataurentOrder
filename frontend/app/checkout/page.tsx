"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { useTable } from "@/contexts/TableContext";
import { useOrder } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { orderService } from "@/services/order.service";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { selectedTable } = useTable();
  const { setCurrentOrder } = useOrder();
  const { user, isAuthenticated } = useAuth();

  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flag to prevent redirect when order is placed (cart becomes empty)
  const orderPlacedRef = useRef(false);

  // Redirect if cart is empty (but not if order was just placed)
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      if (!orderPlacedRef.current) {
        router.push("/menu");
      }
    }
  }, [cart, router]);

  // Redirect to table selection if no table selected
  useEffect(() => {
    if (!selectedTable) {
      router.push("/select-table");
    }
  }, [selectedTable, router]);

  const handlePlaceOrder = async () => {
    if (!cart || !selectedTable) {
      setError("Please select a table first");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const order = await orderService.createOrder(
        cart,
        selectedTable.id,
        customerNotes
      );

      // Set current order for tracking
      setCurrentOrder(order);

      // Set flag before clearing cart to prevent redirect to menu
      orderPlacedRef.current = true;

      // Clear cart after successful order
      clearCart();

      // Redirect to confirmation page
      router.push(`/orders/confirmation?order=${order.order_number}`);
    } catch (err: any) {
      console.error("Error placing order:", err);
      const data = err.response?.data;
      let errorMessage = "Failed to place order. Please try again.";
      if (data) {
        if (typeof data === "string") {
          errorMessage = data;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors)
            ? data.non_field_errors.join(". ")
            : data.non_field_errors;
        } else if (data.message) {
          errorMessage = data.message;
        } else {
          // Handle nested validation errors (e.g. {items: ["..."], table: ["..."]})
          const messages = Object.entries(data)
            .map(([key, val]) =>
              `${key}: ${Array.isArray(val) ? val.join(", ") : val}`
            )
            .join(". ");
          if (messages) errorMessage = messages;
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative section-dark text-white py-24 pt-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            CHECKOUT
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Review your order and complete your purchase
          </p>
        </div>
      </section>

      {/* Checkout Content */}
      <section className="py-16 section-light">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Order Details */}
              <div>
                {/* Table Information */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h2 className="text-2xl font-bold text-baristas-brown-dark mb-4">
                    Table Information
                  </h2>
                  {selectedTable ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Table Number:</span>
                        <span className="font-semibold text-baristas-brown-dark">
                          {selectedTable.number}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Section:</span>
                        <span className="font-semibold text-baristas-brown-dark">
                          {selectedTable.section}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Floor:</span>
                        <span className="font-semibold text-baristas-brown-dark">
                          {selectedTable.floor}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600">No table selected</p>
                  )}
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h2 className="text-2xl font-bold text-baristas-brown-dark mb-4">
                    Your Order
                  </h2>
                  <div className="space-y-4">
                    {cart.items.map((item, index) => (
                      <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.menuItem.image || "/hero-image.webp"}
                            alt={item.menuItem.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-baristas-brown-dark">
                            {item.menuItem.name}
                          </h3>
                          {item.variant && (
                            <p className="text-sm text-gray-600">
                              Size: {item.variant.name}
                            </p>
                          )}
                          {item.addons.length > 0 && (
                            <p className="text-sm text-gray-600">
                              Add-ons: {item.addons.map(a => a.addon.name).join(", ")}
                            </p>
                          )}
                          {item.special_instructions && (
                            <p className="text-sm text-gray-600 italic">
                              Note: {item.special_instructions}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-baristas-brown-dark">
                            {item.total_price} dh
                          </p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-baristas-brown-dark mb-4">
                    Special Instructions
                  </h2>
                  <textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Any special requests? (e.g., no onions, extra sauce)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-baristas-brown transition-colors resize-none"
                    rows={4}
                  />
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div>
                <div className="bg-baristas-brown-dark rounded-2xl shadow-2xl p-8 text-white sticky top-24">
                  <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold">{cart.subtotal.toFixed(2)} DH</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%)</span>
                      <span className="font-semibold">{cart.tax.toFixed(2)} DH</span>
                    </div>
                    {cart.discount > 0 && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount</span>
                        <span className="font-semibold">-{cart.discount.toFixed(2)} DH</span>
                      </div>
                    )}
                    <div className="border-t border-baristas-brown-light pt-3 mt-3">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span>{cart.total.toFixed(2)} DH</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  {isAuthenticated && user && (
                    <div className="mb-6 p-4 bg-baristas-brown/50 rounded-xl">
                      <p className="text-sm text-gray-300 mb-1">Ordering as:</p>
                      <p className="font-semibold">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-gray-300">{user.email}</p>
                    </div>
                  )}

                  {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting || !selectedTable}
                      className="w-full bg-baristas-cream text-baristas-brown-dark py-4 rounded-xl font-bold text-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Placing Order..." : "Place Order"}
                    </button>

                    <button
                      onClick={() => router.push("/menu")}
                      className="w-full bg-transparent border-2 border-baristas-cream text-baristas-cream py-3 rounded-xl font-semibold hover:bg-baristas-cream hover:text-baristas-brown-dark transition-colors"
                    >
                      Continue Shopping
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-6 text-center">
                    By placing this order, you agree to our terms and conditions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
