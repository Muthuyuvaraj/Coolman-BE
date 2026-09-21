import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAccount } from "@/contexts/AccountContext";
import { createOrder } from "@/lib/api";

export default function CheckoutPage() {
  const { account } = useAccount();
  const { items, subtotal, discountAmount, total, appliedCoupon, clearCart } = useCart();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(account?.phone || "");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const deliveryFee = subtotal >= 999 ? 0 : 79;

  if (!account) return <div className="container mx-auto px-4 py-20 text-center"><h1 className="font-display text-3xl font-bold">Create an account to checkout</h1><p className="mx-auto mt-3 max-w-md text-muted-foreground">Your account keeps your order and delivery details together.</p><Link className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground" to="/profile?redirect=/checkout">Create account or sign in</Link></div>;
  if (!items.length) return <div className="container mx-auto px-4 py-20 text-center"><h1 className="font-display text-3xl font-bold">Your cart is empty</h1><Link className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground" to="/shop">Shop products</Link></div>;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const order = await createOrder({ customerName: account.name, customerEmail: account.email, phone, address, items: items.map(({ product, size, quantity }) => ({ productId: product.id, name: product.name, size, quantity, price: product.price })), subtotal, deliveryFee, discount: discountAmount, total: total + deliveryFee, couponCode: appliedCoupon?.code });
      clearCart();
      navigate(`/track?order=${encodeURIComponent(order.orderId)}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not place order.");
    }
  };

  return <div className="container mx-auto max-w-2xl px-4 py-10"><h1 className="font-display text-3xl font-bold">Checkout</h1><p className="mt-2 text-muted-foreground">Signed in as {account.email}</p><form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card"><label className="block text-sm font-medium">Phone<input required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label><label className="block text-sm font-medium">Delivery address<textarea required minLength={5} value={address} onChange={(event) => setAddress(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-border bg-background px-4 py-3" /></label><div className="flex items-center justify-between border-t border-border pt-4"><span className="font-bold">Total</span><span className="font-display text-2xl font-extrabold">₹{total + deliveryFee}</span></div>{error && <p className="text-sm text-destructive">{error}</p>}<button className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground">Place order</button></form></div>;
}