"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order } from '@/types/order.types';
import { orderService } from '@/services/order.service';

interface OrderContextType {
  currentOrder: Order | null;
  myOrders: Order[];
  isLoading: boolean;
  error: string | null;
  setCurrentOrder: (order: Order | null) => void;
  loadMyOrders: () => Promise<void>;
  loadOrder: (orderId: number) => Promise<void>;
  trackOrder: (orderId: number) => Promise<void>;
  clearCurrentOrder: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [currentOrder, setCurrentOrderState] = useState<Order | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCurrentOrder = (order: Order | null) => {
    setCurrentOrderState(order);
    if (order && typeof window !== 'undefined') {
      localStorage.setItem('current_order', JSON.stringify(order));
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('current_order');
    }
  };

  const clearCurrentOrder = () => {
    setCurrentOrderState(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('current_order');
    }
  };

  const loadMyOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const orders = await orderService.getMyOrders();
      setMyOrders(orders);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrder = async (orderId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const order = await orderService.getOrder(orderId);
      setCurrentOrder(order);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
      console.error('Error loading order:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const trackOrder = async (orderId: number) => {
    try {
      const order = await orderService.getOrder(orderId);
      setCurrentOrder(order);
    } catch (err: any) {
      console.error('Error tracking order:', err);
    }
  };

  const value = {
    currentOrder,
    myOrders,
    isLoading,
    error,
    setCurrentOrder,
    loadMyOrders,
    loadOrder,
    trackOrder,
    clearCurrentOrder,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
