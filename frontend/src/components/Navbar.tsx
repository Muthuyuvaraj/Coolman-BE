import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, User, Moon, Sun, Menu, X, Heart, Star } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/hooks/useProducts";
import { motion, AnimatePresence } from "framer-motion";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

const navLinks = [
  { label: "Shop", path: "/shop" },
  { label: "Customize", path: "/customize" },
  { label: "Offers", path: "/offers" },
  { label: "Track Order", path: "/track" },
];

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();

  // Ctrl+K / Cmd+K keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectProduct = useCallback(
    (productId: string) => {
      setSearchOpen(false);
      navigate(`/product/${productId}`);
    },
    [navigate],
  );

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 glass-surface backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground shadow-glow">
              C
            </span>
            COOL<span className="text-primary">MAN</span>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-border bg-card/70 p-2 shadow-card md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-all ${
                  location.pathname === link.path
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-full border border-border bg-card p-2.5 text-foreground transition-colors hover:bg-secondary"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-full border border-border bg-card p-2.5 text-foreground transition-colors hover:bg-secondary"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
            <Link to="/wishlist" className="rounded-full border border-border bg-card p-2.5 text-foreground transition-colors hover:bg-secondary" aria-label="Wishlist">
              <Heart size={18} />
            </Link>
            <Link to="/cart" className="relative rounded-full border border-border bg-card p-2.5 text-foreground transition-colors hover:bg-secondary" aria-label="Cart">
              <ShoppingBag size={18} />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            </Link>
            <Link to="/profile" className="hidden rounded-full border border-border bg-card p-2.5 text-foreground transition-colors hover:bg-secondary sm:block" aria-label="Profile">
              <User size={18} />
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-full border border-border bg-card p-2.5 text-foreground transition-colors hover:bg-secondary md:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border bg-card/90 md:hidden"
            >
              <div className="flex flex-col gap-1 p-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium uppercase tracking-[0.2em] transition-colors ${
                      location.pathname === link.path
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search Command Palette */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search products, categories, fabrics..." />
        <CommandList>
          <CommandEmpty>No products found.</CommandEmpty>
          <CommandGroup heading="Products">
            {products.map((product) => (
              <CommandItem
                key={product.id}
                value={`${product.name} ${product.category} ${product.fabric}`}
                onSelect={() => handleSelectProduct(product.id)}
                className="cursor-pointer gap-3 p-2"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold">{product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {product.category} · {product.fabric}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-sm font-bold">₹{product.price}</span>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Star size={10} className="fill-primary text-primary" />
                    {product.rating}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
