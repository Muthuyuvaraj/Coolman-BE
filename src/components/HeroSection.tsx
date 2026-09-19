import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0b0b0b]">
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Coolman streetwear"
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,162,93,0.24),transparent_30%),linear-gradient(90deg,rgba(8,8,8,0.86)_0%,rgba(8,8,8,0.72)_42%,rgba(8,8,8,0.28)_100%)]" />
      </div>

      <div className="container relative mx-auto flex min-h-[88vh] items-center px-4 pb-10 pt-12">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-xl"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5 inline-flex rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary"
          >
            New Collection 2026
          </motion.span>

          <h1 className="font-display text-5xl font-bold leading-[0.94] tracking-[-0.05em] text-white sm:text-6xl lg:text-8xl">
            Define Your
            <br />
            <span className="text-gradient">Street Style</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
            Premium streetwear crafted for confidence, comfort, and all-day movement.
            Discover limited drops engineered for everyday expression.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              Shop Now
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/customize"
              className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
            >
              Customize
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/80">
            <div>
              <span className="block text-2xl font-bold text-white">25k+</span>
              <span className="text-white/70">happy customers</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">4.9/5</span>
              <span className="text-white/70">average rating</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">48h</span>
              <span className="text-white/70">dispatch time</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
