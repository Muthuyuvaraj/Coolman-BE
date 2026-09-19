import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import plainTshirtBlack from "@/assets/products/plain-tshirt-black.jpg";
import hoodieWhite from "@/assets/products/hoodie-white.jpg";
import trackPantsOlive from "@/assets/products/track-pants-olive.jpg";
import customTshirt from "@/assets/products/custom-tshirt.jpg";
import shortsGrey from "@/assets/products/shorts-grey.jpg";
import jerseyRed from "@/assets/products/jersey-red.jpg";

const cats = [
  { name: "Plain T-Shirts", image: plainTshirtBlack },
  { name: "Hoodies", image: hoodieWhite },
  { name: "Track Pants", image: trackPantsOlive },
  { name: "Custom Tees", image: customTshirt },
  { name: "Shorts", image: shortsGrey },
  { name: "Sportswear", image: jerseyRed },
];

export default function CategorySection() {
  return (
    <section className="bg-secondary/30 py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <span className="mb-3 inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            browse styles
          </span>
          <h2 className="section-heading text-foreground">Shop by Category</h2>
          <p className="mt-3 text-base text-muted-foreground">Find your perfect fit</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cats.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Link
                to="/shop"
                className="group flex flex-col items-center gap-3"
              >
                <div className="aspect-square w-full overflow-hidden rounded-[28px] border border-border bg-card shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-card-hover">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground transition-colors group-hover:text-primary">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
