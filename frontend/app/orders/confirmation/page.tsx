"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useOrder } from "@/contexts/OrderContext";
import { orderService } from "@/services/order.service";

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentOrder, setCurrentOrder } = useOrder();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderNumber = searchParams.get("order");

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderNumber) {
        setError("No order number provided");
        setIsLoading(false);
        return;
      }

      try {
        const order = await orderService.getOrderByNumber(orderNumber);
        setCurrentOrder(order);
      } catch (err: any) {
        console.error("Error loading order:", err);
        setError("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    if (!currentOrder || currentOrder.order_number !== orderNumber) {
      loadOrder();
    } else {
      setIsLoading(false);
    }
  }, [orderNumber, currentOrder, setCurrentOrder]);

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
            <button className="btn-primary">
              Back to Menu
            </button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate estimated ready time
  const estimatedMinutes = currentOrder.preparation_time || 20;
  const estimatedTime = `${estimatedMinutes}–${estimatedMinutes + 5} minutes`;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Success Section */}
      <section className="py-20 pt-32 section-light">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-baristas-brown-dark mb-4 flex items-center justify-center gap-3">
                THANK YOU FOR YOUR ORDER! ☕
              </h1>
              <p className="text-gray-600 text-lg">
                Your order has been received and is being prepared
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-baristas-beige overflow-hidden">
              {/* Order Number */}
              <div className="bg-baristas-cream p-6 border-b-2 border-baristas-beige">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Order Number:</p>
                    <p className="text-2xl font-bold text-baristas-brown-dark">
                      #{currentOrder.order_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Status:</p>
                    <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold text-sm">
                      {currentOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="p-8 space-y-6">
                {/* Estimated Ready Time */}
                <div className="flex justify-between items-center pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-baristas-cream rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-baristas-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Ready Time:</p>
                      <p className="text-xl font-bold text-baristas-brown-dark">{estimatedTime}</p>
                    </div>
                  </div>
                </div>

                {/* Pickup Location */}
                <div className="flex justify-between items-center pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-baristas-cream rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-baristas-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pickup Location:</p>
                      <p className="font-semibold text-baristas-brown-dark">
                        BARISTAS – Table {currentOrder.table_number || currentOrder.table}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Total */}
                <div className="flex justify-between items-center pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-baristas-cream rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-baristas-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order Total:</p>
                      <p className="text-2xl font-bold text-baristas-brown-dark">
                        {currentOrder.total_amount} DH
                      </p>
                    </div>
                  </div>
                </div>

                {/* Odoo Sync Status */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      currentOrder.synced_to_odoo ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      {currentOrder.synced_to_odoo ? (
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">System Sync:</p>
                      <p className={`font-semibold ${
                        currentOrder.synced_to_odoo ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {currentOrder.synced_to_odoo
                          ? `Synced (ID: ${currentOrder.odoo_order_id})`
                          : 'Pending sync'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/orders/${currentOrder.id}`}>
                <button className="w-full sm:w-auto btn-primary px-8 py-4 text-lg">
                  Track Order
                </button>
              </Link>
              <Link href="/menu">
                <button className="w-full sm:w-auto btn-secondary px-8 py-4 text-lg">
                  Continue Shopping
                </button>
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-2">
                Need help with your order?
              </p>
              <Link href="/contact" className="text-baristas-brown font-semibold hover:text-baristas-brown-dark">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-baristas-brown border-t-transparent mb-4"></div>
            <p className="text-baristas-brown-dark">Loading order details...</p>
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
