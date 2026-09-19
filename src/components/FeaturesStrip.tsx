import { Truck, RotateCcw, Shield, Headphones } from "lucide-react";

const features = [
  { icon: Truck, label: "Free Shipping", desc: "On orders above ₹999" },
  { icon: RotateCcw, label: "Easy Returns", desc: "7-day return policy" },
  { icon: Shield, label: "Secure Payment", desc: "100% secure checkout" },
  { icon: Headphones, label: "24/7 Support", desc: "We're here to help" },
];

export default function FeaturesStrip() {
  return (
    <section className="border-y border-border/60 bg-card/80 py-8">
      <div className="container mx-auto grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.label}
            className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/40 p-4 shadow-card transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
              <f.icon size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
