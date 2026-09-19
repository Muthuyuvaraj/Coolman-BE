import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Percent, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCoupon, fetchAdminCoupons, updateCoupon } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminCouponsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const couponsQuery = useQuery({ queryKey: ["admin-coupons"], queryFn: fetchAdminCoupons, refetchInterval: 15000 });
  const coupons = couponsQuery.data ?? [];
  const [form, setForm] = useState({ code: "", discountType: "percentage", discountValue: "", expiryDate: "", usageLimit: "" });
  const createMutation = useMutation({ mutationFn: () => createCoupon({ code: form.code, discountType: form.discountType, discountValue: Number(form.discountValue), expiryDate: form.expiryDate, usageLimit: Number(form.usageLimit), active: true }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-coupons"] }); setDialogOpen(false); toast({ title: "Coupon created" }); }, onError: (error: Error) => toast({ title: "Could not create coupon", description: error.message, variant: "destructive" }) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Coupons</h1>
          <p className="text-muted-foreground text-sm">{coupons.length} coupons</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">Create Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Coupon Code</Label><Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="SUMMER25" /></div>
              <div><Label>Discount Type</Label>
                <Select value={form.discountType} onValueChange={(discountType) => setForm({ ...form, discountType })}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Discount Value</Label><Input type="number" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: event.target.value })} placeholder="20" /></div>
              <div><Label>Expiry Date</Label><Input type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} /></div>
              <div><Label>Usage Limit</Label><Input type="number" value={form.usageLimit} onChange={(event) => setForm({ ...form, usageLimit: event.target.value })} placeholder="100" /></div>
              <div className="flex items-center gap-2"><Switch defaultChecked /><Label>Active</Label></div>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !form.code || !form.discountValue || !form.expiryDate || !form.usageLimit} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.code}>
                  <TableCell className="font-mono font-bold">{c.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      {c.discountType === "percentage" ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                      {c.discountType}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.discountType === "percentage" ? `${c.discountValue}%` : `₹${c.discountValue}`}</TableCell>
                  <TableCell className="text-muted-foreground">{c.expiryDate}</TableCell>
                  <TableCell>{c.usedCount}/{c.usageLimit}</TableCell>
                  <TableCell><Switch checked={c.active} onCheckedChange={(active) => updateCoupon(c.code, active).then(() => queryClient.invalidateQueries({ queryKey: ["admin-coupons"] })).catch((error: Error) => toast({ title: "Could not update coupon", description: error.message, variant: "destructive" }))} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
