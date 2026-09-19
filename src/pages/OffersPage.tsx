import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Copy, Check, Percent, Zap, Gift, Tag } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";

const coupons = [
  { code: "COOL20", discount: "20% OFF", description: "On orders above ₹1499", icon: Percent, validTill: "March 15, 2026" },
  { code: "FIRST50", discount: "₹50 OFF", description: "First order special", icon: Gift, validTill: "March 31, 2026" },
  { code: "HOODIE30", discount: "30% OFF", description: "All hoodies & jackets", icon: Tag, validTill: "Feb 28, 2026" },
  { code: "FLASH10", discount: "Flat ₹100 OFF", description: "No minimum order", icon: Zap, validTill: "Limited time" },
];

const deals = [
  { title: "Buy 2 Get 1 Free", subtitle: "On all plain T-shirts", bg: "from-primary/20 to-primary/5", icon: "🔥" },
  { title: "Flat 40% OFF", subtitle: "Hoodies collection", bg: "from-badge-new/20 to-badge-new/5", icon: "❄️" },
  { title: "Combo Offer", subtitle: "Track Pants + Tee @ ₹1999", bg: "from-ring/20 to-ring/5", icon: "💪" },
];

export default function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const saleProducts = products.filter((p) => p.badge === "sale" || p.originalPrice);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          🎯 Offers & <span className="text-gradient">Deals</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Exclusive deals, coupon codes, and limited-time offers curated just for you.
        </p>
      </motion.div>

      {/* Banner Deals */}
      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {deals.map((deal, i) => (
          <motion.div
            key={deal.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${deal.bg} border border-border/50 p-6 text-center`}
          >
            <span className="mb-2 block text-4xl">{deal.icon}</span>
            <h3 className="font-display text-xl font-bold">{deal.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{deal.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Coupon Codes */}
      <div className="mb-12">
        <h2 className="mb-6 font-display text-2xl font-bold">🎟️ Coupon Codes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {coupons.map((coupon, i) => (
            <motion.div
              key={coupon.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 shadow-card transition-all hover:shadow-card-hover"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <coupon.icon size={24} />
              </div>
              <div className="flex-1">
                <p className="font-display text-lg font-bold">{coupon.discount}</p>
                <p className="text-sm text-muted-foreground">{coupon.description}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock size={10} />
                  Valid till {coupon.validTill}
                </div>
              </div>
              <button
                onClick={() => handleCopy(coupon.code)}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/10"
              >
                {copiedCode === coupon.code ? (
                  <>
                    <Check size={14} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    {coupon.code}
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sale Products */}
      <div>
        <h2 className="mb-6 font-display text-2xl font-bold">💥 On Sale Now</h2>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {saleProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
