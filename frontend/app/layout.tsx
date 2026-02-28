import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { TableProvider } from "@/contexts/TableContext";
import { OrderProvider } from "@/contexts/OrderContext";
import CartSidebar from "@/components/cart/CartSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Baristas - Restaurant Order Platform",
  description: "Your daily dose of comfort. Brewed, baked, and beautifully served.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Baristas",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B2316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <TableProvider>
              <OrderProvider>
                <CartProvider>
                  {children}
                  <CartSidebar />
                  <ToastProvider />
                </CartProvider>
              </OrderProvider>
            </TableProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
