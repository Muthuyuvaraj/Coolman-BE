import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminAnalytics } from "@/lib/api";

const COLORS = ["hsl(24 95% 53%)", "hsl(0 0% 35%)", "hsl(142 71% 45%)", "hsl(220 70% 55%)", "hsl(280 60% 55%)"];

const chartTooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 };

export default function AdminAnalyticsPage() {
  const analyticsQuery = useQuery({ queryKey: ["admin-analytics"], queryFn: fetchAdminAnalytics, refetchInterval: 15000 });
  const analytics = analyticsQuery.data;
  const categoryShare = analytics?.categoryShare ?? [];
  const dailySales = analytics?.dailySales ?? [];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm">Sales & performance insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display">Sales Overview (Weekly)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySales}>
                  <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(24 95% 53%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(24 95% 53%)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="sales" stroke="hsl(24 95% 53%)" fill="url(#sg)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="revenue" fill="hsl(24 95% 53%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">Order Trends</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySales}>
                  <defs><linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="orders" stroke="hsl(142 71% 45%)" fill="url(#og)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">Category Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryShare} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                    {categoryShare.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">Top Selling Products</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryShare.map((p, i) => (
              <div key={p.name} className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.name}</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, p.value)}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{p.value} items</p>
                  <p className="text-xs text-muted-foreground">Live category share</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
