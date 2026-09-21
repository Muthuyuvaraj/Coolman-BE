import { useQuery } from "@tanstack/react-query";
import { products } from "@/data/products";
import { fetchProducts } from "@/lib/api";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const localImages = new Map(products.map((product) => [product.id, product.image]));
      const remoteProducts = await fetchProducts();
      return remoteProducts.map((product) => ({
        ...product,
        image: product.image || localImages.get(product.id) || "",
      }));
    },
    staleTime: 30_000,
    retry: false,
  });
}
