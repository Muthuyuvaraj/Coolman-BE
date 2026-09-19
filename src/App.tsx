import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { AccountProvider } from "@/contexts/AccountContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
const Index = lazy(() => import("./pages/Index"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const CustomizePage = lazy(() => import("./pages/CustomizePage"));
const OffersPage = lazy(() => import("./pages/OffersPage"));
const TrackOrderPage = lazy(() => import("./pages/TrackOrderPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin
import AdminLayout from "./admin/AdminLayout";
const DashboardPage = lazy(() => import("./admin/pages/DashboardPage"));
const AdminProductsPage = lazy(() => import("./admin/pages/AdminProductsPage"));
const AdminOrdersPage = lazy(() => import("./admin/pages/AdminOrdersPage"));
const AdminCustomersPage = lazy(() => import("./admin/pages/AdminCustomersPage"));
const AdminCouponsPage = lazy(() => import("./admin/pages/AdminCouponsPage"));
const AdminPaymentsPage = lazy(() => import("./admin/pages/AdminPaymentsPage"));
const AdminAnalyticsPage = lazy(() => import("./admin/pages/AdminAnalyticsPage"));
const AdminSettingsPage = lazy(() => import("./admin/pages/AdminSettingsPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <AccountProvider>
          <WishlistProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
            <Routes>
            {/* Admin routes — separate layout, no Navbar/Footer */}
            <Route path="/admin-dashboard" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="coupons" element={<AdminCouponsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Store routes */}
            <Route
              path="*"
              element={
                <>
                  <Navbar />
                  <main className="min-h-screen">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/shop" element={<ShopPage />} />
                      <Route path="/customize" element={<CustomizePage />} />
                      <Route path="/offers" element={<OffersPage />} />
                      <Route path="/track" element={<TrackOrderPage />} />
                      <Route path="/product/:id" element={<ProductDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </>
              }
            />
            </Routes>
            </Suspense>
          </BrowserRouter>
          </WishlistProvider>
        </AccountProvider>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
