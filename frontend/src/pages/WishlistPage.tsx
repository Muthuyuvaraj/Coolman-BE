import { Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/contexts/WishlistContext";

export default function WishlistPage() {
  const { items } = useWishlist();

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <span className="mb-3 inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            saved styles
          </span>
          <h1 className="section-heading">Your Wishlist</h1>
          <p className="mt-3 text-muted-foreground">
            {items.length === 0
              ? "Keep the pieces you love close by."
              : `${items.length} saved ${items.length === 1 ? "piece" : "pieces"}`}
          </p>
        </div>
        {items.length > 0 && (
          <Link
            to="/shop"
            className="hidden items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:border-primary hover:text-primary sm:inline-flex"
          >
            Continue shopping
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-card/60 px-6 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart size={28} />
          </div>
          <h2 className="font-display text-2xl font-bold">Nothing saved yet</h2>
          <p className="mt-2 max-w-md text-muted-foreground">
            Tap the heart on any product to build your personal collection.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:shadow-glow"
          >
            Explore the shop
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
