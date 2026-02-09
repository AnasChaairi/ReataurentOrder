"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useOrder } from "@/contexts/OrderContext";
import { orderService } from "@/services/order.service";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrder, loadOrder } = useOrder();
  const [orderTimeline, setOrderTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.orderId as string;

  useEffect(() => {
    const abortController = new AbortController();

    const fetchOrderData = async () => {
      if (!orderId) return;

      setIsLoading(true);
      setError(null);

      try {
        await loadOrder(parseInt(orderId));

        // Load order timeline
        try {
          const timeline = await orderService.getOrderTimeline(parseInt(orderId));
          if (!abortController.signal.aborted) {
            setOrderTimeline(timeline);
          }
        } catch (timelineError: any) {
          if (!abortController.signal.aborted && timelineError.name !== 'AbortError') {
            console.error("Error loading timeline:", timelineError);
          }
          // Continue even if timeline fails
        }
      } catch (err: any) {
        if (!abortController.signal.aborted && err.name !== 'AbortError') {
          console.error("Error loading order:", err);
          setError("Failed to load order details");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrderData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrderData, 30000);

    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, [orderId, loadOrder]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-baristas-brown border-t-transparent mb-4"></div>
          <p className="text-baristas-brown-dark">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !currentOrder) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-8">{error || "Unable to load order details"}</p>
          <Link href="/menu">
            <button className="btn-primary">Back to Menu</button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "PREPARING":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "READY":
        return "bg-green-100 text-green-800 border-green-300";
      case "SERVED":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return 25;
      case "CONFIRMED":
        return 40;
      case "PREPARING":
        return 65;
      case "READY":
        return 90;
      case "SERVED":
        return 100;
      default:
        return 0;
    }
  };

  const statusProgress = getStatusProgress(currentOrder.status);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Order Header */}
      <section className="relative section-dark text-white py-20 pt-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Order #{currentOrder.order_number}
            </h1>
            <div className={`inline-block px-6 py-3 rounded-full font-semibold text-lg border-2 ${getStatusColor(currentOrder.status)}`}>
              {currentOrder.status}
            </div>
          </div>
        </div>
      </section>

      {/* Order Tracking Content */}
      <section className="py-16 section-light">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Progress Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-baristas-brown-dark mb-6">
                Order Progress
              </h2>
              <div className="relative">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-baristas-brown to-baristas-brown-light transition-all duration-500"
                    style={{ width: `${statusProgress}%` }}
                  ></div>
                </div>
                <p className="text-center mt-2 text-sm text-gray-600">
                  {statusProgress}% Complete
                </p>
              </div>

              {/* Status Steps */}
              <div className="grid grid-cols-5 gap-2 mt-8">
                {["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED"].map((step) => {
                  const isActive = getStatusProgress(step) <= statusProgress;
                  return (
                    <div key={step} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${isActive ? "bg-baristas-brown text-white" : "bg-gray-200 text-gray-400"}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className={`text-xs mt-2 ${isActive ? "text-baristas-brown-dark font-semibold" : "text-gray-500"}`}>
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-baristas-brown-dark mb-6">
                Order Details
              </h2>

              <div className="space-y-4">
                {currentOrder.items?.map((item: any, index: number) => (
                  <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={item.menu_item_image || "/hero-image.webp"}
                        alt={item.menu_item_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-baristas-brown-dark">
                        {item.menu_item_name}
                      </h3>
                      {item.variant_name && (
                        <p className="text-sm text-gray-600">Variant: {item.variant_name}</p>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Add-ons: {item.addons.map((a: any) => a.addon_name).join(", ")}
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
                        {item.price} dh
                      </p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>{currentOrder.subtotal.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Tax</span>
                    <span>{currentOrder.tax.toFixed(2)} DH</span>
                  </div>
                  {currentOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{currentOrder.discount.toFixed(2)} DH</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-baristas-brown-dark pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{currentOrder.total_amount} DH</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            {orderTimeline.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-baristas-brown-dark mb-6">
                  Order Timeline
                </h2>
                <div className="space-y-4">
                  {orderTimeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-baristas-cream rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-baristas-brown rounded-full"></div>
                        </div>
                        {index < orderTimeline.length - 1 && (
                          <div className="w-0.5 flex-1 bg-baristas-beige my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-semibold text-baristas-brown-dark">
                          {event.event_type}
                        </p>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/menu" className="flex-1">
                <button className="w-full btn-secondary py-4">
                  Order More Items
                </button>
              </Link>
              {currentOrder.status === "PENDING" && (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to cancel this order?")) {
                      orderService.cancelOrder(currentOrder.id).then(() => {
                        router.push("/menu");
                      });
                    }
                  }}
                  className="flex-1 bg-red-600 text-white py-4 rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
