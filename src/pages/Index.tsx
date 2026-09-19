import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import ProductGrid from "@/components/ProductGrid";
import FeaturesStrip from "@/components/FeaturesStrip";
import NewsletterSection from "@/components/NewsletterSection";
import { useProducts } from "@/hooks/useProducts";

const Index = () => {
  const { data: products = [] } = useProducts();
  const featured = products.filter((p) => p.badge === "trending" || p.rating >= 4.5);
  const newArrivals = products.filter((p) => p.badge === "new");
  const onSale = products.filter((p) => p.badge === "sale");

  return (
    <div>
      <HeroSection />
      <FeaturesStrip />
      <ProductGrid
        title="🔥 Featured Products"
        subtitle="Our most loved styles"
        products={featured}
      />
      <CategorySection />
      <ProductGrid
        title="🆕 New Arrivals"
        subtitle="Fresh drops just landed"
        products={newArrivals}
      />
      <ProductGrid
        title="💥 Limited Time Offers"
        subtitle="Grab them before they're gone"
        products={onSale}
      />
      <NewsletterSection />
    </div>
  );
};

export default Index;
