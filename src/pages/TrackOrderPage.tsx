import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Package, Truck, CheckCircle2, MapPin, Clock, Box } from "lucide-react";
import { fetchTrackedOrder, type AdminOrder } from "@/lib/api";

type OrderStatus = "placed" | "confirmed" | "shipped" | "out_for_delivery" | "delivered";
const steps: { key: OrderStatus; label: string; icon: typeof Box }[] = [
  { key: "placed", label: "Placed", icon: Box },
  { key: "confirmed", label: "Confirmed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];
const statusIndex: Record<OrderStatus, number> = { placed: 0, confirmed: 1, shipped: 2, out_for_delivery: 3, delivered: 4 };

export default function TrackOrderPage() {
  const [trackingId, setTrackingId] = useState("");
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    const normalized = trackingId.trim().toUpperCase();
    if (!normalized) return setError("Enter your tracking number.");
    setLoading(true);
    setError("");
    try {
      setOrder(await fetchTrackedOrder(normalized));
    } catch (requestError) {
      setOrder(null);
      setError(requestError instanceof Error ? requestError.message : "Tracking number not found.");
    } finally {
      setLoading(false);
    }
  };

  const activeStep = order ? statusIndex[(order.status as OrderStatus)] ?? 0 : -1;
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Track Your Order</h1>
        <p className="mt-2 text-muted-foreground">Enter the tracking number shown in your profile after checkout.</p>
        <div className="mt-8 flex gap-2">
          <div className="relative flex-1"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={trackingId} onChange={(event) => setTrackingId(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleTrack()} placeholder="e.g. TRK-A1B2C3D4E5" className="w-full rounded-xl border border-border bg-card py-3.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary" /></div>
          <button onClick={handleTrack} disabled={loading} className="rounded-xl bg-primary px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-60">{loading ? "Searching" : "Track"}</button>
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>
      {order && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-10 max-w-2xl">
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tracking number</p><p className="font-mono text-lg font-bold">{order.trackingId}</p><p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Order ID</p><p className="font-display text-lg font-bold">{order.orderId}</p></div><div className="text-right"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Status</p><p className="font-display text-lg font-bold capitalize text-primary">{order.status.replaceAll("_", " ")}</p></div></div>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Clock size={14} /> Ordered on {order.createdAt?.slice(0, 10)}</div><p className="mt-1 text-sm text-muted-foreground">{order.items.map((item) => `${item.name} x ${item.quantity}`).join(", ")}</p>
        </div>
        <div className="mt-8 flex items-center justify-between px-2">{steps.map((step, index) => { const Icon = step.icon; const active = index <= activeStep; return <div key={step.key} className="flex flex-1 items-center"><div className="flex flex-col items-center gap-1.5"><div className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}><Icon size={18} /></div><span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span></div>{index < steps.length - 1 && <div className={`mx-1 h-0.5 flex-1 rounded-full ${index < activeStep ? "bg-primary" : "bg-border"}`} />}</div>; })}</div>
      </motion.div>}
    </div>
  );
}
