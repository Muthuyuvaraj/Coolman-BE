import { motion } from "framer-motion";
import { Send } from "lucide-react";

export default function NewsletterSection() {
  return (
    <section className="bg-[#111111] py-16 sm:py-24">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-card sm:p-12"
        >
          <span className="mb-3 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            insider access
          </span>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Join the <span className="text-gradient">Coolman</span> Club
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/65">
            Get early access to drops, exclusive offers, and 10% off your first order.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              <Send size={16} />
              Subscribe
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
