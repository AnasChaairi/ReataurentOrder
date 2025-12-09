import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { TableProvider } from "@/contexts/TableContext";
import { OrderProvider } from "@/contexts/OrderContext";
import CartSidebar from "@/components/cart/CartSidebar";

export const metadata: Metadata = {
  title: "Baristas - Restaurant Order Platform",
  description: "Your daily dose of comfort. Brewed, baked, and beautifully served.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <TableProvider>
            <OrderProvider>
              <CartProvider>
                {children}
                <CartSidebar />
              </CartProvider>
            </OrderProvider>
          </TableProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
