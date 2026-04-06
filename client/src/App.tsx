import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { CartProvider, useCart } from "@/lib/cart";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { CartDrawer } from "@/components/cart-drawer";
import { PaymentModal, type CartCheckoutItem } from "@/components/payment-modal";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Dashboard from "@/pages/dashboard";
import ResetPassword from "@/pages/reset-password";
import Reviews from "@/pages/reviews";
import StatusPage from "@/pages/status";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/status" component={StatusPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function GlobalCartCheckout() {
  const { items, clearCart } = useCart();
  const [cartPaymentOpen, setCartPaymentOpen] = useState(false);
  const [cartCheckoutItems, setCartCheckoutItems] = useState<CartCheckoutItem[]>([]);

  const handleCartCheckout = () => {
    if (items.length === 0) return;
    setCartCheckoutItems(items.map(i => ({
      productId: i.productId,
      productName: i.productName,
      price: i.price,
      quantity: i.quantity,
    })));
    setCartPaymentOpen(true);
  };

  return (
    <>
      <CartDrawer onCheckout={handleCartCheckout} />
      {cartCheckoutItems.length > 0 && (
        <PaymentModal
          product={null}
          quantity={1}
          open={cartPaymentOpen}
          onOpenChange={setCartPaymentOpen}
          onPaymentComplete={() => {}}
          cartItems={cartCheckoutItems}
          onCartClear={clearCart}
        />
      )}
    </>
  );
}

function ThemeColorsProvider({ children }: { children: React.ReactNode }) {
  useThemeColors();
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeColorsProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
                <GlobalCartCheckout />
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeColorsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
