import { useEffect, useRef, useState, useCallback } from "react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag, ArrowRight, X, Package } from "lucide-react";

interface CartDrawerProps {
  onCheckout: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setIsOpen } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      setIsOpen(false);
      triggerRef.current?.focus();
    }, 250);
  }, [setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.querySelector('[data-testid="button-cart"]') as HTMLElement;
      setVisible(true);
      setClosing(false);
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        closeRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!visible) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [visible, handleClose]);

  useEffect(() => {
    if (!visible || !panelRef.current) return;
    const panel = panelRef.current;
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    panel.addEventListener("keydown", trap);
    return () => panel.removeEventListener("keydown", trap);
  }, [visible, items.length]);

  const handleRemove = (productId: string) => {
    setRemoving(productId);
    setTimeout(() => {
      removeItem(productId);
      setRemoving(null);
    }, 200);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
      data-testid="cart-panel"
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-250 ${closing ? "opacity-0" : "animate-in fade-in duration-200"}`}
        onClick={handleClose}
        data-testid="cart-overlay"
      />

      <div
        ref={panelRef}
        className={`
          absolute bg-background/95 backdrop-blur-2xl
          flex flex-col

          right-0 top-0 bottom-0 w-full sm:w-[420px] md:w-[460px]
          border-l border-border/40

          max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full
          max-sm:max-h-[85vh] max-sm:rounded-t-3xl max-sm:border-l-0 max-sm:border-t max-sm:border-border/40

          transition-transform duration-300 ease-out
          ${closing
            ? "sm:translate-x-full max-sm:translate-y-full"
            : "sm:animate-in sm:slide-in-from-right sm:duration-300 max-sm:animate-in max-sm:slide-in-from-bottom max-sm:duration-300"
          }
        `}
        data-testid="cart-drawer"
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent sm:hidden" />
        <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-transparent to-primary/30 hidden sm:block" />

        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center px-1.5 shadow-lg shadow-primary/30">
                  {totalItems}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground" data-testid="text-cart-title">Your Cart</h2>
              <p className="text-xs text-muted-foreground" data-testid="text-cart-count">
                {totalItems === 0 ? "No items yet" : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10"
                data-testid="button-clear-cart"
              >
                Clear all
              </button>
            )}
            <button
              ref={closeRef}
              onClick={handleClose}
              aria-label="Close cart"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              data-testid="button-close-cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
                <div className="relative w-20 h-20 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                </div>
              </div>
              <p className="text-base font-semibold text-foreground mb-1">Your cart is empty</p>
              <p className="text-sm text-muted-foreground text-center max-w-[240px]">
                Browse products and add items to start shopping
              </p>
              <Button
                variant="outline"
                className="mt-6 gap-2 rounded-xl"
                onClick={handleClose}
                data-testid="button-continue-shopping"
              >
                <Package className="w-4 h-4" />
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-2">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className={`
                    group relative flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl
                    bg-muted/30 border border-border/30 hover:border-border/60
                    transition-all duration-200
                    ${removing === item.productId ? "opacity-0 scale-95 -translate-x-4" : "opacity-100"}
                  `}
                  data-testid={`cart-item-${item.productId}`}
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-border/40 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug" data-testid={`text-cart-item-name-${item.productId}`}>
                        {item.productName}
                      </p>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        aria-label={`Remove ${item.productName}`}
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-60 group-hover:opacity-100"
                        data-testid={`button-remove-${item.productId}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-background/80 rounded-xl border border-border/40 p-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${item.productName}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors active:scale-90"
                          data-testid={`button-decrease-${item.productId}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-foreground tabular-nums select-none" data-testid={`text-cart-item-qty-${item.productId}`}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          aria-label={`Increase quantity of ${item.productName}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                          data-testid={`button-increase-${item.productId}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary tabular-nums" data-testid={`text-cart-item-subtotal-${item.productId}`}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[10px] text-muted-foreground tabular-nums">
                            ${item.price.toFixed(2)} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border/40 p-4 sm:p-6 space-y-4 bg-background/80 backdrop-blur-xl">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                <span className="text-foreground font-medium tabular-nums">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="h-px bg-border/30" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-primary/60 font-medium">CAD</span>
                  <span className="text-2xl font-bold text-foreground tabular-nums" data-testid="text-cart-total">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                handleClose();
                setTimeout(onCheckout, 260);
              }}
              className="w-full h-12 sm:h-13 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base gap-2.5 rounded-xl shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]"
              data-testid="button-checkout"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5" />
            </Button>

            <p className="text-[11px] text-muted-foreground text-center">
              Crypto & manual payment accepted
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
