import plainTshirtBlack from "@/assets/products/plain-tshirt-black.jpg";
import hoodieWhite from "@/assets/products/hoodie-white.jpg";
import trackPantsOlive from "@/assets/products/track-pants-olive.jpg";
import fullsleeveNavy from "@/assets/products/fullsleeve-navy.jpg";
import shortsGrey from "@/assets/products/shorts-grey.jpg";
import jerseyRed from "@/assets/products/jersey-red.jpg";
import customTshirt from "@/assets/products/custom-tshirt.jpg";

export type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  sizes: string[];
  fabric: string;
  category: string;
  badge?: "new" | "sale" | "trending";
  inStock: boolean;
};

export const products: Product[] = [
  {
    id: "1",
    name: "Essential Black Tee",
    price: 799,
    originalPrice: 1299,
    image: plainTshirtBlack,
    rating: 4.5,
    reviews: 128,
    sizes: ["S", "M", "L", "XL", "XXL"],
    fabric: "100% Cotton",
    category: "Plain T-Shirts",
    badge: "trending",
    inStock: true,
  },
  {
    id: "2",
    name: "Cloud White Hoodie",
    price: 1999,
    originalPrice: 2999,
    image: hoodieWhite,
    rating: 4.8,
    reviews: 89,
    sizes: ["S", "M", "L", "XL"],
    fabric: "Cotton Fleece",
    category: "Hoodies",
    badge: "sale",
    inStock: true,
  },
  {
    id: "3",
    name: "Olive Jogger Pants",
    price: 1499,
    image: trackPantsOlive,
    rating: 4.3,
    reviews: 67,
    sizes: ["M", "L", "XL", "XXL"],
    fabric: "Polyester Blend",
    category: "Track Pants",
    badge: "new",
    inStock: true,
  },
  {
    id: "4",
    name: "Navy Full Sleeve Tee",
    price: 999,
    image: fullsleeveNavy,
    rating: 4.6,
    reviews: 54,
    sizes: ["S", "M", "L", "XL"],
    fabric: "Cotton Jersey",
    category: "Full Sleeve T-Shirts",
    inStock: true,
  },
  {
    id: "5",
    name: "Athletic Grey Shorts",
    price: 899,
    originalPrice: 1199,
    image: shortsGrey,
    rating: 4.2,
    reviews: 43,
    sizes: ["S", "M", "L", "XL", "XXL"],
    fabric: "Breathable Cotton",
    category: "Shorts",
    badge: "sale",
    inStock: true,
  },
  {
    id: "6",
    name: "Pro Red Jersey Tee",
    price: 1299,
    image: jerseyRed,
    rating: 4.7,
    reviews: 91,
    sizes: ["M", "L", "XL"],
    fabric: "Jersey Material",
    category: "Jersey Sportswear",
    badge: "trending",
    inStock: true,
  },
  {
    id: "7",
    name: "Street Art Custom Tee",
    price: 1599,
    image: customTshirt,
    rating: 4.9,
    reviews: 156,
    sizes: ["S", "M", "L", "XL", "XXL"],
    fabric: "Premium Cotton",
    category: "Customized T-Shirts",
    badge: "new",
    inStock: true,
  },
  {
    id: "8",
    name: "Midnight Black Hoodie",
    price: 2199,
    originalPrice: 2999,
    image: hoodieWhite,
    rating: 4.4,
    reviews: 72,
    sizes: ["S", "M", "L", "XL"],
    fabric: "Cotton Fleece",
    category: "Hoodies",
    badge: "sale",
    inStock: true,
  },
];

export const categories = [
  "All",
  "Plain T-Shirts",
  "Customized T-Shirts",
  "Full Sleeve T-Shirts",
  "Hoodies",
  "Track Pants",
  "Shorts",
  "Jersey Sportswear",
];
