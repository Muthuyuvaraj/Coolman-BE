import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminOrders } from "@/lib/api";

const statusColor: Record<string, string> = {
  completed: "bg-badge-new/10 text-badge-new border-badge-new/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  refunded: "bg-muted text-muted-foreground",
};

export default function AdminPaymentsPage() {
  const ordersQuery = useQuery({ queryKey: ["admin-orders"], queryFn: fetchAdminOrders, refetchInterval: 15000 });
  const orders = ordersQuery.data ?? [];
  const completed = orders.filter((order) => order.paymentStatus === "completed");
  const failed = orders.filter((order) => order.paymentStatus === "failed");
  const refunded = orders.filter((order) => order.paymentStatus === "refunded");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground text-sm">{orders.length} transactions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Completed</p><p className="text-2xl font-bold text-badge-new">{completed.length}</p><p className="text-xs text-muted-foreground">₹{completed.reduce((sum, order) => sum + order.total, 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Failed</p><p className="text-2xl font-bold text-destructive">{failed.length}</p><p className="text-xs text-muted-foreground">₹{failed.reduce((sum, order) => sum + order.total, 0).toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Refunded</p><p className="text-2xl font-bold text-muted-foreground">{refunded.length}</p><p className="text-xs text-muted-foreground">₹{refunded.reduce((sum, order) => sum + order.total, 0).toLocaleString()}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">All Transactions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((t) => (
                <TableRow key={t.orderId}>
                  <TableCell className="font-medium">{t.orderId}</TableCell>
                  <TableCell className="text-muted-foreground">{t.orderId}</TableCell>
                  <TableCell>{t.customerName}</TableCell>
                  <TableCell>₹{t.total.toLocaleString()}</TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[t.paymentStatus]}>{t.paymentStatus}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{t.createdAt?.slice(0, 10)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
