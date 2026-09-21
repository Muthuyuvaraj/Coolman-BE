import { DollarSign, ShoppingCart, Users, Clock, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { fetchAdminAnalytics, fetchAdminOrders, type AdminOrder } from "@/lib/api";

const statusColor: Record<string, string> = {
  delivered: "bg-badge-new/10 text-badge-new border-badge-new/20",
  shipped: "bg-primary/10 text-primary border-primary/20",
  out_for_delivery: "bg-primary/10 text-primary border-primary/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function DashboardPage() {
  const analytics = useQuery({ queryKey: ["admin-analytics"], queryFn: fetchAdminAnalytics, refetchInterval: 15000 });
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: fetchAdminOrders, refetchInterval: 15000 });
  const data = analytics.data;
  const dailySales = data?.dailySales ?? [];
  const stats = [
    { title: "Total Revenue", value: `₹${(data?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign },
    { title: "Total Orders", value: String(data?.totalOrders ?? 0), icon: ShoppingCart },
    { title: "Total Customers", value: String(data?.totalCustomers ?? 0), icon: Users },
    { title: "Pending Orders", value: String(data?.pendingOrders ?? 0), icon: Clock },
    { title: "Low Stock", value: String(data?.lowStock ?? 0), icon: AlertTriangle },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Weekly Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(24 95% 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(24 95% 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="sales" stroke="hsl(24 95% 53%)" fill="url(#salesGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orders.data ?? []).slice(0, 5).map((o: AdminOrder) => (
                <TableRow key={o.orderId}>
                  <TableCell className="font-medium">{o.orderId}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell>₹{o.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[o.status]}>
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{o.createdAt?.slice(0, 10)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
