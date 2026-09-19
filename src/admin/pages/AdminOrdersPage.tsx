import { useState } from "react";
import { Search, Eye, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { fetchAdminOrders, updateAdminOrder, type AdminOrder } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusColor: Record<string, string> = {
  delivered: "bg-badge-new/10 text-badge-new border-badge-new/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  out_for_delivery: "bg-primary/10 text-primary border-primary/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const paymentColor: Record<string, string> = {
  paid: "bg-badge-new/10 text-badge-new border-badge-new/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  refunded: "bg-muted text-muted-foreground",
};

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editTrackingId, setEditTrackingId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({ queryKey: ["admin-orders"], queryFn: fetchAdminOrders, refetchInterval: 15000 });
  const updateMutation = useMutation({ mutationFn: ({ id, changes }: { id: string; changes: { status?: string; trackingId?: string } }) => updateAdminOrder(id, changes), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast({ title: "Order updated" }); }, onError: (error: Error) => toast({ title: "Could not update order", description: error.message, variant: "destructive" }) });
  const orders = ordersQuery.data ?? [];

  const filtered = orders.filter((o) =>
    o.orderId.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const openOrder = (order: AdminOrder) => {
    setSelected(order);
    setEditStatus(order.status);
    setEditTrackingId(order.trackingId || "");
  };

  const saveOrderChanges = () => {
    if (!selected) return;
    updateMutation.mutate({ id: selected.orderId, changes: { status: editStatus, trackingId: editTrackingId.trim() } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground text-sm">{orders.length} total orders</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by order ID or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.orderId}>
                  <TableCell className="font-medium">{o.orderId}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell className="max-w-[150px] truncate text-muted-foreground">{o.items.map((item) => item.name).join(", ")}</TableCell>
                  <TableCell>₹{o.total.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline" className={paymentColor[o.paymentStatus]}>{o.paymentStatus}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[o.status]}>{o.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{o.createdAt?.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openOrder(o)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Order {selected?.orderId}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Customer:</span><p className="font-medium">{selected.customerName}</p></div>
                <div><span className="text-muted-foreground">Email:</span><p className="font-medium">{selected.customerEmail}</p></div>
                <div><span className="text-muted-foreground">Amount:</span><p className="font-medium">₹{selected.total.toLocaleString()}</p></div>
                <div><span className="text-muted-foreground">Date:</span><p className="font-medium">{selected.createdAt?.slice(0, 10)}</p></div>
              </div>
              <div><span className="text-sm text-muted-foreground">Products:</span><p className="text-sm font-medium">{selected.items.map((item) => `${item.name} (${item.quantity})`).join(", ")}</p></div>
              <div><Label>Update Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Tracking ID</Label><Input value={editTrackingId} onChange={(event) => setEditTrackingId(event.target.value.toUpperCase())} placeholder="TRK-A1B2C3D4E5" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-sm text-muted-foreground">Payment:</span>
                  <Badge variant="outline" className={paymentColor[selected.paymentStatus]}>{selected.paymentStatus}</Badge>
                </div>
              </div>
              <Button onClick={saveOrderChanges} disabled={updateMutation.isPending || !editStatus} className="w-full"><Save className="mr-2 h-4 w-4" />{updateMutation.isPending ? "Saving..." : "Save Changes"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
