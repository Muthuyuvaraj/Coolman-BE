import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct, deleteProduct, fetchAdminProducts, updateProduct, type AdminProduct } from "@/lib/api";
import { categories } from "@/data/products";
import { useToast } from "@/hooks/use-toast";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState({ name: "", price: "", originalPrice: "", stock: "", category: "", fabric: "", image: "", description: "", colors: "", sizes: "S, M, L, XL", badge: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: fetchAdminProducts,
    retry: false,
    refetchInterval: 15000,
  });
  const savedProducts = productsQuery.data ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return updateProduct(editing.id, {
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          inStock: Number(form.stock) > 0,
          category: form.category,
          fabric: form.fabric,
          image: form.image,
          originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
          description: form.description,
          colors: form.colors.split(",").map((color) => color.trim()).filter(Boolean),
          sizes: form.sizes.split(",").map((size) => size.trim()).filter(Boolean),
          badge: form.badge || undefined,
        });
      }
      const id = `product-${Date.now()}`;
      return createProduct({
        id,
        name: form.name,
        price: Number(form.price),
        image: form.image,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        rating: 0,
        reviews: 0,
        sizes: form.sizes.split(",").map((size) => size.trim()).filter(Boolean),
        fabric: form.fabric,
        category: form.category,
        inStock: Number(form.stock) > 0,
        stock: Number(form.stock),
        active: true,
        description: form.description || `Premium quality ${form.name}`,
        colors: form.colors.split(",").map((color) => color.trim()).filter(Boolean),
        badge: form.badge || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
      setEditing(null);
      toast({ title: "Product saved", description: "The customer storefront will now use this update." });
    },
    onError: (error) => toast({ title: "Could not save product", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_, id) => {
      queryClient.setQueryData<AdminProduct[]>(["admin-products"], (current = []) => current.filter((product) => product.id !== id));
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted", description: "The product was removed from the storefront." });
    },
    onError: (error) => toast({ title: "Could not delete product", description: error.message, variant: "destructive" }),
  });

  const filtered = savedProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openEditor = (product?: AdminProduct) => {
    setEditing(product || null);
    setForm({
      name: product?.name || "",
      price: String(product?.price || ""),
      stock: String(product?.stock || ""),
      category: product?.category || "",
      fabric: product?.fabric || "",
      image: product?.image || "",
      originalPrice: String(product?.originalPrice || ""),
      description: product?.description || "",
      colors: product?.colors?.join(", ") || "",
      sizes: product?.sizes?.join(", ") || "S, M, L, XL",
      badge: product?.badge || "",
    });
    setDialogOpen(true);
  };

  const handleImageChange = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid image", description: "Choose a PNG, JPG, WEBP, or GIF image.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image is too large", description: "Choose an image smaller than 2 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, image: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm">{savedProducts.length} products</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => openEditor()}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Product Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(category) => setForm({ ...form, category })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price (₹)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="999" /></div>
                <div><Label>Stock Quantity</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="50" /></div>
              </div>
              <div><Label>Fabric Type</Label><Input value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} placeholder="100% Cotton" /></div>
              <div><Label>Description</Label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the product" className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4"><div><Label>Original Price (₹)</Label><Input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} placeholder="1299" /></div><div><Label>Badge</Label><Select value={form.badge || "none"} onValueChange={(badge) => setForm({ ...form, badge: badge === "none" ? "" : badge })}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="new">New</SelectItem><SelectItem value="sale">Sale</SelectItem><SelectItem value="trending">Trending</SelectItem></SelectContent></Select></div></div>
              <div><Label>Sizes</Label><Input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" /></div>
              <div><Label>Colors</Label><Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Black, White" /></div>
              <div>
                <Label>Product Image</Label>
                <Input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => handleImageChange(e.target.files?.[0])} />
                {form.image && <img src={form.image} alt="Product preview" className="mt-3 h-32 w-full rounded-lg object-cover" />}
              </div>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.price || !form.category} className="w-full">Save Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {productsQuery.isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading products from MongoDB...</p>}
          {productsQuery.isError && <div className="flex flex-col items-center gap-3 py-8 text-center"><p className="text-sm text-destructive">Could not load products. Check that the backend is running on port 8000.</p><Button variant="outline" size="sm" onClick={() => productsQuery.refetch()}>Try again</Button></div>}
          {!productsQuery.isLoading && !productsQuery.isError && filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No products match your search.</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!productsQuery.isLoading && !productsQuery.isError && filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.image ? <img src={p.image} alt={p.name} className="h-10 w-10 rounded-md object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-xs font-bold text-muted-foreground">CM</div>}
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.category}</TableCell>
                  <TableCell>₹{p.price}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.stock < 15 ? "border-destructive/30 text-destructive" : "border-badge-new/30 text-badge-new"}>
                      {p.stock}
                    </Badge>
                  </TableCell>
                  <TableCell><Switch checked={p.active} onCheckedChange={(active) => updateProduct(p.id, { active }).then(() => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); queryClient.invalidateQueries({ queryKey: ["products"] }); }).catch((error: Error) => toast({ title: "Could not update status", description: error.message, variant: "destructive" }))} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditor(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
