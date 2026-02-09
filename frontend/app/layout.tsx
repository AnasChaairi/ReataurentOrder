import type { Metadata } from "next";
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
  themeColor: "#3B2316",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Baristas",
  },
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
