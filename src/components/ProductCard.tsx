import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, ShoppingBag, Star, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

const badgeColors = {
  new: "bg-badge-new",
  sale: "bg-badge-sale",
  trending: "bg-badge-trending",
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const liked = isWishlisted(product.id);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleAddToCart = () => {
    const size = selectedSize || product.sizes[0];
    addItem(product, size);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card transition-all duration-500 hover:shadow-card-hover hover:-translate-y-1"
    >
      {/* Image Container */}
      <Link to={`/product/${product.id}`} className="relative aspect-[3/4] overflow-hidden bg-surface-sunken block">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badge */}
        {product.badge && (
          <motion.span
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-lg ${badgeColors[product.badge]}`}
          >
            {product.badge}
          </motion.span>
        )}

        {/* Discount tag */}
        {discount > 0 && (
          <span className="absolute right-3 top-3 rounded-lg bg-destructive px-2 py-1 text-[10px] font-bold text-destructive-foreground shadow-lg">
            -{discount}%
          </span>
        )}

        {/* Wishlist button - always visible */}
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute right-3 bottom-3 z-10 rounded-full p-2.5 shadow-lg backdrop-blur-md transition-all duration-300 ${
            liked
              ? "bg-primary text-primary-foreground scale-110"
              : "bg-card/80 text-card-foreground hover:bg-card hover:scale-110"
          }`}
          aria-label="Wishlist"
        >
          <Heart size={16} className={liked ? "fill-current" : ""} />
        </button>

        {/* Quick View - centered on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setQuickViewOpen(true);
            }}
            className="rounded-full bg-card/90 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-card-foreground shadow-xl backdrop-blur-md transition-all hover:bg-card hover:scale-105"
            aria-label="Quick view"
          >
            <span className="flex items-center gap-2">
              <Eye size={14} />
              Quick View
            </span>
          </button>
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* Fabric tag */}
        <span className="w-fit rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-secondary-foreground">
          {product.fabric}
        </span>

        <Link to={`/product/${product.id}`} className="hover:text-primary transition-colors">
          <h3 className="font-display text-sm font-bold leading-snug text-card-foreground sm:text-base">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={
                  i < Math.floor(product.rating)
                    ? "fill-primary text-primary"
                    : "fill-muted text-muted"
                }
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {product.rating} ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-extrabold text-card-foreground">
            ₹{product.price}
          </span>
          {product.originalPrice && (
            <span className="text-sm font-medium text-muted-foreground line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* Sizes */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {product.sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`h-8 min-w-[2rem] rounded-lg border text-xs font-semibold transition-all duration-200 ${
                selectedSize === size
                  ? "border-primary bg-primary text-primary-foreground shadow-sm scale-105"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-card-foreground"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Add to Cart */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAddToCart}
          className={`mt-auto flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
            addedToCart
              ? "bg-badge-new text-primary-foreground"
              : "bg-primary text-primary-foreground hover:shadow-glow"
          }`}
        >
          <AnimatePresence mode="wait">
            {addedToCart ? (
              <motion.span
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <Check size={16} />
                Added!
              </motion.span>
            ) : (
              <motion.span
                key="cart"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <ShoppingBag size={16} />
                Add to Cart
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <div className="grid sm:grid-cols-2">
            <img src={product.image} alt={product.name} className="h-64 w-full object-cover sm:h-full" />
            <div className="space-y-4 p-6">
              <DialogHeader><DialogTitle className="font-display text-2xl">{product.name}</DialogTitle></DialogHeader>
              <div className="flex items-baseline gap-2"><span className="font-display text-2xl font-extrabold">₹{product.price}</span>{product.originalPrice && <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>}</div>
              <p className="text-sm leading-6 text-muted-foreground">{product.description || `Premium quality ${product.name} made with ${product.fabric}.`}</p>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fabric</p><p className="mt-1 text-sm font-medium">{product.fabric}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available sizes</p><div className="mt-2 flex flex-wrap gap-2">{product.sizes.map((size) => <span key={size} className="rounded-lg border border-border px-3 py-1 text-xs font-semibold">{size}</span>)}</div></div>
              {!!product.colors?.length && <div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Colors</p><p className="mt-1 text-sm font-medium">{product.colors.join(", ")}</p></div>}
              <Link to={`/product/${product.id}`} onClick={() => setQuickViewOpen(false)} className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">View full details</Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
