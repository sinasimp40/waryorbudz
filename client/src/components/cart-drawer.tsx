import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

interface CartDrawerProps {
  onCheckout: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setIsOpen } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        const cartBtn = document.querySelector('[data-testid="button-cart"]');
        if (cartBtn && cartBtn.contains(e.target as Node)) return;
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed top-16 sm:top-20 right-3 sm:right-6 z-[60] w-[calc(100vw-24px)] sm:w-[380px] animate-in fade-in slide-in-from-top-2 duration-200"
      data-testid="cart-panel"
    >
      <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-12px_rgba(0,0,0,0.5),0_0_40px_-8px_hsl(var(--primary)/0.15)]">
        <div className="absolute inset-0 bg-[#0c0c14]/95 backdrop-blur-xl" />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08]" />
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white" data-testid="text-cart-title">Cart</span>
                <span className="text-xs text-gray-500 ml-2" data-testid="text-cart-count">{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-gray-500 hover:text-red-400 transition-colors"
                data-testid="button-clear-cart"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          <div className="max-h-[320px] overflow-y-auto overscroll-contain">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-5">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
                  <ShoppingBag className="w-7 h-7 text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Cart is empty</p>
                <p className="text-xs text-gray-600 mt-1">Browse products to get started</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {items.map(item => (
                  <div
                    key={item.productId}
                    className="group relative flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors"
                    data-testid={`cart-item-${item.productId}`}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-12 h-12 rounded-lg object-cover border border-white/[0.06] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate leading-tight" data-testid={`text-cart-item-name-${item.productId}`}>
                        {item.productName}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors"
                            data-testid={`button-decrease-${item.productId}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold text-white tabular-nums" data-testid={`text-cart-item-qty-${item.productId}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            data-testid={`button-increase-${item.productId}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-primary tabular-nums" data-testid={`text-cart-item-subtotal-${item.productId}`}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-all"
                      data-testid={`button-remove-${item.productId}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xs text-primary/60">$</span>
                    <span className="text-xl font-bold text-white tabular-nums" data-testid="text-cart-total">
                      {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    onCheckout();
                  }}
                  className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 rounded-xl shadow-lg shadow-primary/20"
                  data-testid="button-checkout"
                >
                  Checkout
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
