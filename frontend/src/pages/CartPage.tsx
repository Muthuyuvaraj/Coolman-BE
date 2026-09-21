import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, Tag, X, ArrowRight, PackageOpen } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  const {
    items, removeItem, updateQuantity, clearCart,
    subtotal, appliedCoupon, applyCoupon, removeCoupon,
    discountAmount, total, totalItems,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = () => {
    const err = applyCoupon(couponInput);
    if (err) {
      setCouponError(err);
    } else {
      setCouponError("");
      setCouponInput("");
    }
  };

  const deliveryFee = subtotal >= 999 ? 0 : 79;
  const grandTotal = total + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center px-4 py-20 text-center">
        <PackageOpen size={64} className="mb-4 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Looks like you haven't added anything yet.</p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:shadow-glow"
        >
          <ShoppingBag size={16} /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Shopping Cart
            </h1>
            <p className="mt-1 text-muted-foreground">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={clearCart}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
          >
            Clear All
          </button>
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={`${item.product.id}-${item.size}`}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="flex gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-card sm:gap-6"
              >
                {/* Image */}
                <Link to={`/product/${item.product.id}`} className="shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="h-28 w-24 rounded-xl object-cover sm:h-32 sm:w-28"
                  />
                </Link>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link to={`/product/${item.product.id}`} className="font-display text-sm font-bold hover:text-primary transition-colors sm:text-base">
                      {item.product.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Size: <strong className="text-foreground">{item.size}</strong></span>
                      <span>•</span>
                      <span>{item.product.fabric}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-secondary disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-display text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-secondary"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Price + Delete */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-display text-base font-extrabold">₹{item.product.price * item.quantity}</p>
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-muted-foreground">₹{item.product.price} each</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id, item.size)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border/50 bg-card p-6 shadow-card">
            <h2 className="font-display text-lg font-bold">Order Summary</h2>

            {/* Coupon */}
            <div className="mt-5">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag size={14} className="text-primary" />
                    <span className="font-bold text-primary">{appliedCoupon.code}</span>
                    <span className="text-muted-foreground">applied</span>
                  </div>
                  <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="mt-2 text-xs text-destructive">{couponError}</p>}
                  <p className="mt-2 text-[11px] text-muted-foreground">Try: COOL20, FIRST50, FLASH10</p>
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="mt-6 space-y-3 border-t border-border/50 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">₹{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount ({appliedCoupon?.label})</span>
                  <span className="font-semibold">-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className={`font-semibold ${deliveryFee === 0 ? "text-badge-new" : ""}`}>
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-[11px] text-muted-foreground">Free delivery on orders above ₹999</p>
              )}
            </div>

            {/* Total */}
            <div className="mt-4 flex items-baseline justify-between border-t border-border/50 pt-4">
              <span className="font-display text-lg font-bold">Total</span>
              <span className="font-display text-2xl font-extrabold">₹{grandTotal}</span>
            </div>

            {/* Checkout Button */}
            <Link
              to="/checkout"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:shadow-glow"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </Link>

            <Link
              to="/shop"
              className="mt-3 block text-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
