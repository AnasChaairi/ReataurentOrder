"use client";

import { ReactNode } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { TabletProvider } from "@/contexts/TabletContext";

interface TabletLayoutProps {
  children: ReactNode;
}

export default function TabletLayout({ children }: TabletLayoutProps) {
  return (
    <CartProvider>
      <TabletProvider>
        <div className="tablet-mode min-h-screen flex flex-col bg-baristas-cream">
          {children}
        </div>
      </TabletProvider>
    </CartProvider>
  );
}
