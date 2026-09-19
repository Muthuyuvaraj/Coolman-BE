import ProductCard from "./ProductCard";
import type { Product } from "@/data/products";

interface Props {
  title: string;
  subtitle?: string;
  products: Product[];
}

export default function ProductGrid({ title, subtitle, products }: Props) {
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="mb-3 inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            curated picks
          </span>
          <h2 className="section-heading text-foreground">{title}</h2>
          {subtitle && (
            <p className="mt-3 max-w-xl text-base text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
