import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { categories } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";

export default function ShopPage() {
  const { data: products = [] } = useProducts();
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");

  const filtered = useMemo(() => {
    const result =
      category === "All"
        ? [...products]
        : products.filter((p) => p.category === category);

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }
    return result;
  }, [category, sortBy, products]);

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Shop All
        </h1>
        <p className="mt-1 text-muted-foreground">
          {filtered.length} products
        </p>
      </motion.div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-primary/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          No products found in this category.
        </div>
      )}
    </div>
  );
}
