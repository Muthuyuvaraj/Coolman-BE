import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container mx-auto grid gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="font-display text-xl font-bold">
            COOL<span className="text-primary">MAN</span>
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Premium streetwear for the confident man. Comfort meets style.
          </p>
          <div className="mt-4 flex gap-3">
            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="rounded-full bg-secondary p-2 transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider">Shop</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/shop" className="hover:text-primary">All Products</Link>
            <Link to="/shop" className="hover:text-primary">T-Shirts</Link>
            <Link to="/shop" className="hover:text-primary">Hoodies</Link>
            <Link to="/shop" className="hover:text-primary">Track Pants</Link>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider">Help</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <Link to="/track" className="hover:text-primary">Track Order</Link>
            <a href="#" className="hover:text-primary">Returns</a>
            <a href="#" className="hover:text-primary">Shipping</a>
            <a href="#" className="hover:text-primary">FAQ</a>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider">Company</h4>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">About Us</a>
            <a href="#" className="hover:text-primary">Careers</a>
            <a href="#" className="hover:text-primary">Privacy Policy</a>
            <a href="#" className="hover:text-primary">Terms</a>
          </div>
        </div>
      </div>

      <div className="container mx-auto mt-10 border-t border-border px-4 pt-6 text-center text-xs text-muted-foreground">
        © 2026 Coolman. All rights reserved.
      </div>
    </footer>
  );
}
