import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";

interface CartDrawerProps {
  onCheckout: () => void;
}

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setIsOpen } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={() => setIsOpen(false)}
        data-testid="cart-overlay"
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#0a0a0f] border-l border-gray-200 dark:border-white/[0.06] shadow-2xl z-50 flex flex-col">
        <div className="relative p-4 border-b border-gray-200 dark:border-white/[0.06]">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white" data-testid="text-cart-title">Your Cart</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="text-cart-count">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              data-testid="button-close-cart"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add products to get started</p>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.productId}
                className="group relative rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-3 transition-all hover:border-primary/20"
                data-testid={`cart-item-${item.productId}`}
              >
                <div className="flex gap-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-white/[0.06] flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate" data-testid={`text-cart-item-name-${item.productId}`}>
                      {item.productName}
                    </p>
                    <p className="text-sm text-primary font-semibold mt-0.5" data-testid={`text-cart-item-price-${item.productId}`}>
                      ${item.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-7 h-7 rounded-md border border-gray-300 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        data-testid={`button-decrease-${item.productId}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium tabular-nums" data-testid={`text-cart-item-qty-${item.productId}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="w-7 h-7 rounded-md border border-gray-300 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30"
                        data-testid={`button-increase-${item.productId}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-gray-400 ml-auto" data-testid={`text-cart-item-subtotal-${item.productId}`}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
                    data-testid={`button-remove-${item.productId}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-white/[0.06] p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal ({totalItems} items)</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white" data-testid="text-cart-total">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <Button
              onClick={() => {
                setIsOpen(false);
                onCheckout();
              }}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2"
              data-testid="button-checkout"
            >
              <ShoppingCart className="w-4 h-4" />
              Proceed to Checkout
            </Button>
            <button
              onClick={clearCart}
              className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors py-1"
              data-testid="button-clear-cart"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
