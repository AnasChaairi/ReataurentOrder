"use client";

import { useState, useEffect, useCallback } from "react";
import { TabletOrderResult } from "@/types/tablet.types";
import { useWebSocket } from "@/hooks/useWebSocket";

interface TabletConfirmationProps {
  orderResult: TabletOrderResult;
  tableId: number;
  onNewOrder: () => void;
}

const AUTO_RESET_SECONDS = 60;

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: '📝' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: '✓' },
  { key: 'PREPARING', label: 'Preparing', icon: '🍳' },
  { key: 'READY', label: 'Ready!', icon: '🔔' },
  { key: 'SERVED', label: 'Served', icon: '🍽' },
];

export function TabletConfirmation({ orderResult, tableId, onNewOrder }: TabletConfirmationProps) {
  const [countdown, setCountdown] = useState(AUTO_RESET_SECONDS);
  const [currentStatus, setCurrentStatus] = useState('PENDING');

  const handleNewOrder = useCallback(() => {
    onNewOrder();
  }, [onNewOrder]);

  // WebSocket for real-time status updates
  const handleWsMessage = useCallback((msg: any) => {
    if (msg.type === 'order_status_changed' && msg.order?.order_number === orderResult.orderNumber) {
      setCurrentStatus(msg.new_status);
      // Reset countdown on status change to give user time to see it
      setCountdown(AUTO_RESET_SECONDS);
    }
    if (msg.type === 'order_cancelled' && msg.order?.order_number === orderResult.orderNumber) {
      setCurrentStatus('CANCELLED');
    }
  }, [orderResult.orderNumber]);

  useWebSocket(`/ws/orders/table/${tableId}/`, {
    onMessage: handleWsMessage,
  });

  // Auto-reset countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNewOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleNewOrder]);

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-baristas-cream p-8">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-baristas-brown-dark mb-2">
            Order Placed!
          </h1>
          <p className="text-gray-600">
            Your order has been sent to the kitchen
          </p>
        </div>

        {/* Order Number */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <p className="text-sm text-gray-500 mb-2">Order Number</p>
          <p className="text-4xl font-bold text-baristas-brown tracking-wider">
            #{orderResult.orderNumber}
          </p>
        </div>

        {/* Live Status Tracker */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6" aria-live="polite">
          <p className="text-sm font-semibold text-gray-600 mb-4">Order Status</p>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, idx) => {
              const isActive = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      isCurrent
                        ? 'bg-green-500 text-white scale-110 ring-4 ring-green-200'
                        : isActive
                        ? 'bg-green-400 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <p className={`text-xs mt-1 ${isCurrent ? 'font-bold text-green-700' : 'text-gray-500'}`}>
                    {step.label}
                  </p>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className={`hidden`} /> // Spacer handled by flex
                  )}
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{ width: `${Math.max(5, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Cancelled state */}
        {currentStatus === 'CANCELLED' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-semibold">Order has been cancelled</p>
            <p className="text-red-600 text-sm mt-1">Please contact staff for assistance</p>
          </div>
        )}

        {/* Estimated Time */}
        {orderResult.estimatedTime && currentStatus !== 'CANCELLED' && (
          <div className="bg-baristas-brown-dark text-white rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-lg">
                Estimated time: <strong>{orderResult.estimatedTime} min</strong>
              </span>
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-left">
          <p className="text-blue-800 text-sm">
            <strong>What happens next?</strong>
            <br />
            A waiter will come to your table to confirm your order. Your food
            will be prepared fresh and served to your table.
          </p>
        </div>

        {/* New Order Button */}
        <button
          onClick={handleNewOrder}
          className="w-full tablet-btn bg-baristas-brown text-white rounded-full mb-4 min-h-[56px]"
          aria-label="Start a new order"
        >
          Start New Order
        </button>

        {/* Auto-reset countdown */}
        <p className="text-gray-500 text-sm">
          Returning to menu in <strong>{countdown}</strong> seconds...
        </p>
      </div>
    </div>
  );
}
