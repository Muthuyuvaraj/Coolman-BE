import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface CouponInfo {
  code: string;
  discount: number; // percentage
  label: string;
}

const VALID_COUPONS: Record<string, CouponInfo> = {
  COOL20: { code: "COOL20", discount: 20, label: "20% OFF" },
  FIRST50: { code: "FIRST50", discount: 5, label: "₹50 OFF (flat)" },
  HOODIE30: { code: "HOODIE30", discount: 30, label: "30% OFF" },
  FLASH10: { code: "FLASH10", discount: 10, label: "10% OFF" },
};

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  appliedCoupon: CouponInfo | null;
  applyCoupon: (code: string) => string | null; // returns error or null
  removeCoupon: () => void;
  discountAmount: number;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponInfo | null>(null);

  const addItem = useCallback((product: Product, size: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, size, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.size === size)));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.size === size ? { ...i, quantity } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const applyCoupon = useCallback((code: string): string | null => {
    const coupon = VALID_COUPONS[code.trim().toUpperCase()];
    if (!coupon) return "Invalid coupon code";
    setAppliedCoupon(coupon);
    return null;
  }, []);

  const removeCoupon = useCallback(() => setAppliedCoupon(null), []);

  const discountAmount = appliedCoupon
    ? appliedCoupon.code === "FIRST50"
      ? 50
      : Math.round((subtotal * appliedCoupon.discount) / 100)
    : 0;

  const total = Math.max(0, subtotal - discountAmount);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        discountAmount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
