import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchAdminSettings, updateAdminSettings } from "@/lib/api";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const settingsQuery = useQuery({ queryKey: ["admin-settings"], queryFn: fetchAdminSettings });
  const [storeName, setStoreName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [phone, setPhone] = useState("");
  const saveMutation = useMutation({ mutationFn: () => updateAdminSettings({ storeName, supportEmail, phone }), onSuccess: () => toast({ title: "Settings saved" }), onError: (error: Error) => toast({ title: "Could not save settings", description: error.message, variant: "destructive" }) });

  useEffect(() => { if (settingsQuery.data) { setStoreName(settingsQuery.data.storeName); setSupportEmail(settingsQuery.data.supportEmail); setPhone(settingsQuery.data.phone); } }, [settingsQuery.data]);

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your store settings</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">Store Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Store Name</Label><Input value={storeName} onChange={(e) => setStoreName(e.target.value)} /></div>
          <div><Label>Support Email</Label><Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} /></div>
          <div><Label>Contact Number</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <Button onClick={handleSave}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Current Password</Label><Input type="password" placeholder="••••••••" /></div>
          <div><Label>New Password</Label><Input type="password" placeholder="••••••••" /></div>
          <div><Label>Confirm Password</Label><Input type="password" placeholder="••••••••" /></div>
          <Button onClick={() => toast({ title: "Password updated" })}>Update Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="font-display text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">These actions are irreversible.</p>
          <Button variant="destructive">Delete All Data</Button>
        </CardContent>
      </Card>
    </div>
  );
}
