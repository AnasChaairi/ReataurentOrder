"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { useTablet } from "@/contexts/TabletContext";
import { orderService } from "@/services/order.service";
import { TabletOrderResult } from "@/types/tablet.types";

interface TabletCartProps {
  onBack: () => void;
  onOrderPlaced: (result: TabletOrderResult) => void;
}

export function TabletCart({ onBack, onOrderPlaced }: TabletCartProps) {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { table } = useTablet();
  const [customerNotes, setCustomerNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceOrder = async () => {
    if (!table) {
      setError("Table information not available. Please contact staff.");
      return;
    }

    if (cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setIsPlacingOrder(true);
    setError(null);

    try {
      const order = await orderService.createOrder(cart, table.id, customerNotes);

      onOrderPlaced({
        orderId: order.id,
        orderNumber: order.order_number,
        estimatedTime: order.preparation_time,
        syncedToOdoo: order.synced_to_odoo || false,
        odooSyncError: order.odoo_sync_error,
      });
    } catch (err: any) {
      console.error("Error placing order:", err);
      setError(
        err.response?.data?.message ||
          "Failed to place order. Please try again or contact staff."
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-baristas-cream">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-baristas-brown-dark hover:text-baristas-brown flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Menu
        </button>
        <h1 className="text-2xl font-bold text-baristas-brown-dark flex-1 text-center">
          Your Order
        </h1>
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {cart.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-xl font-semibold text-baristas-brown-dark mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-6">
                Add some delicious items from our menu!
              </p>
              <button
                onClick={onBack}
                className="tablet-btn bg-baristas-brown text-white rounded-full"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 shadow-sm flex gap-4"
                  >
                    {/* Item Image */}
                    {item.menuItem.image && (
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={item.menuItem.image}
                          alt={item.menuItem.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Item Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-baristas-brown-dark">
                            {item.menuItem.name}
                          </h3>
                          {item.variant && (
                            <p className="text-sm text-gray-500">{item.variant.name}</p>
                          )}
                          {item.addons.length > 0 && (
                            <p className="text-sm text-gray-500">
                              + {item.addons.map((a) => a.addon.name).join(", ")}
                            </p>
                          )}
                          {item.special_instructions && (
                            <p className="text-xs text-gray-400 mt-1 italic">
                              "{item.special_instructions}"
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-3 bg-baristas-cream rounded-full px-3 py-1">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="w-8 h-8 rounded-full bg-white text-baristas-brown-dark font-bold hover:bg-gray-100 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-semibold text-baristas-brown-dark min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="w-8 h-8 rounded-full bg-white text-baristas-brown-dark font-bold hover:bg-gray-100 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-lg font-bold text-baristas-brown-dark">
                          {item.total_price.toFixed(2)} dh
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Instructions */}
              <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                <h3 className="font-semibold text-baristas-brown-dark mb-2">
                  Special Instructions
                </h3>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Any special requests for the kitchen? (allergies, preferences, etc.)"
                  className="w-full p-3 rounded-lg border border-gray-200 focus:border-baristas-brown focus:ring-1 focus:ring-baristas-brown outline-none resize-none"
                  rows={3}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                <h3 className="font-semibold text-baristas-brown-dark mb-4">
                  Order Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{cart.subtotal.toFixed(2)} dh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span>{cart.tax.toFixed(2)} dh</span>
                  </div>
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{cart.discount.toFixed(2)} dh</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold text-baristas-brown-dark">
                      <span>Total</span>
                      <span>{cart.total.toFixed(2)} dh</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || cart.items.length === 0}
                className="w-full tablet-btn bg-baristas-brown text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Placing Order...
                  </>
                ) : (
                  <>
                    <span>Place Order</span>
                    <span className="font-bold">{cart.total.toFixed(2)} dh</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
