import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Check, Star, Truck, RotateCcw, Shield, ChevronRight, Minus, Plus } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { products } from "@/data/products";
import { useCart } from "@/contexts/CartContext";

const sizeGuide: Record<string, string> = {
  S: "36\" Chest, 27\" Length",
  M: "38\" Chest, 28\" Length",
  L: "40\" Chest, 29\" Length",
  XL: "42\" Chest, 30\" Length",
  XXL: "44\" Chest, 31\" Length",
};

const mockReviews = [
  { name: "Arjun K.", rating: 5, date: "Feb 12, 2026", comment: "Fabric quality is insane for this price. Super comfortable and fits perfectly." },
  { name: "Rohan M.", rating: 4, date: "Jan 28, 2026", comment: "Great product! Slightly tight around the shoulders but overall amazing." },
  { name: "Priya S.", rating: 5, date: "Jan 15, 2026", comment: "Bought this for my brother and he loved it. Colors don't fade after wash." },
];

export default function ProductDetailPage() {
  const { addItem } = useCart();
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "reviews" | "size-guide">("description");

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Product not found</h1>
        <Link to="/shop" className="mt-4 inline-block text-primary underline">Back to Shop</Link>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    const size = selectedSize || product.sizes[0];
    addItem(product, size, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">{product.name}</span>
      </nav>

      {/* Main */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-surface-sunken"
        >
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
          {product.badge && (
            <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground ${
              product.badge === "new" ? "bg-badge-new" : product.badge === "sale" ? "bg-badge-sale" : "bg-badge-trending"
            }`}>
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute right-4 top-4 rounded-lg bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">
              -{discount}%
            </span>
          )}
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-5"
        >
          <div>
            <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-secondary-foreground">
              {product.fabric}
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.floor(product.rating) ? "fill-primary text-primary" : "fill-muted text-muted"}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl font-extrabold">₹{product.price}</span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-muted-foreground line-through">₹{product.originalPrice}</span>
                <span className="rounded-full bg-badge-sale/10 px-2.5 py-0.5 text-xs font-bold text-badge-sale">
                  Save ₹{product.originalPrice - product.price}
                </span>
              </>
            )}
          </div>

          {/* Sizes */}
          <div>
            <p className="mb-2 text-sm font-semibold">Select Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`h-11 min-w-[2.75rem] rounded-xl border text-sm font-semibold transition-all ${
                    selectedSize === size
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <p className="mb-2 text-sm font-semibold">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-secondary"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-display text-lg font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-secondary"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider transition-all ${
                addedToCart
                  ? "bg-badge-new text-primary-foreground"
                  : "bg-primary text-primary-foreground hover:shadow-glow"
              }`}
            >
              <AnimatePresence mode="wait">
                {addedToCart ? (
                  <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                    <Check size={16} /> Added to Cart!
                  </motion.span>
                ) : (
                  <motion.span key="add" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                    <ShoppingBag size={16} /> Add to Cart
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <button
              onClick={() => setLiked(!liked)}
              className={`flex h-[52px] w-[52px] items-center justify-center rounded-xl border transition-all ${
                liked ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              <Heart size={20} className={liked ? "fill-current" : ""} />
            </button>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <Truck size={18} className="text-primary" />
              <span className="text-[11px] font-semibold">Free Delivery</span>
              <span className="text-[10px] text-muted-foreground">Above ₹999</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <RotateCcw size={18} className="text-primary" />
              <span className="text-[11px] font-semibold">Easy Returns</span>
              <span className="text-[10px] text-muted-foreground">7 days</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Shield size={18} className="text-primary" />
              <span className="text-[11px] font-semibold">Quality Check</span>
              <span className="text-[10px] text-muted-foreground">Verified</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mx-auto mt-16 max-w-3xl">
        <div className="flex gap-1 rounded-xl bg-secondary p-1">
          {(["description", "reviews", "size-guide"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "size-guide" ? "Size Guide" : tab}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "description" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                The <strong className="text-foreground">{product.name}</strong> is crafted from premium {product.fabric.toLowerCase()} for
                ultimate comfort and durability. Designed for the modern streetwear enthusiast who values both style and substance.
              </p>
              <p>
                Features a relaxed fit with reinforced stitching, pre-shrunk fabric, and a tagless neck label for all-day comfort.
                Available in sizes {product.sizes.join(", ")}.
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Material: {product.fabric}</li>
                <li>Fit: Regular / Relaxed</li>
                <li>Care: Machine wash cold, tumble dry low</li>
                <li>Made in India 🇮🇳</li>
              </ul>
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {mockReviews.map((review, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{review.name}</p>
                        <p className="text-[11px] text-muted-foreground">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} size={12} className={j < review.rating ? "fill-primary text-primary" : "fill-muted text-muted"} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "size-guide" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="overflow-hidden rounded-xl border border-border/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="px-4 py-3 text-left font-semibold">Size</th>
                      <th className="px-4 py-3 text-left font-semibold">Measurements</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(sizeGuide).map(([size, measurement]) => (
                      <tr key={size} className="border-t border-border/50">
                        <td className="px-4 py-3 font-bold">{size}</td>
                        <td className="px-4 py-3 text-muted-foreground">{measurement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold">You May Also Like</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
