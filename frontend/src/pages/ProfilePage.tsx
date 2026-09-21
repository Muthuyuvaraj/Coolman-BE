import { FormEvent, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { fetchCustomerOrders, type AdminOrder } from "@/lib/api";

export default function ProfilePage() {
  const { account, signUp, signIn, signOut } = useAccount();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const ordersQuery = useQuery({
    queryKey: ["customer-orders", account?.email],
    queryFn: () => fetchCustomerOrders(account!.email),
    enabled: Boolean(account),
    refetchInterval: 15000,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = mode === "signup" ? signUp({ name, email, phone, password }) : signIn(email, password);
    setError(result || "");
  };

  if (account) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <section className="rounded-[28px] border border-border bg-card p-8 shadow-card sm:p-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound size={28} /></div>
              <h1 className="font-display text-3xl font-bold">Welcome, {account.name}</h1>
              <p className="mt-3 text-muted-foreground">{account.email}</p>
            </div>
            <button onClick={signOut} className="rounded-xl border border-border px-5 py-3 font-bold">Sign out</button>
          </div>
          {params.get("redirect") && <p className="mt-4 text-sm text-muted-foreground">Your account is ready. Return to checkout to place your order.</p>}
          <div className="mt-10 border-t border-border pt-8">
            <h2 className="font-display text-2xl font-bold">Your orders</h2>
            {ordersQuery.isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading your orders...</p>}
            {ordersQuery.isError && <p className="mt-4 text-sm text-destructive">Could not load your orders. Check that the backend is running.</p>}
            {!ordersQuery.isLoading && !ordersQuery.isError && ordersQuery.data?.length === 0 && <p className="mt-4 text-sm text-muted-foreground">You have not placed an order yet.</p>}
            <div className="mt-4 space-y-4">
              {ordersQuery.data?.map((order: AdminOrder) => (
                <article key={order.orderId} className="rounded-2xl border border-border p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Order</p><p className="font-bold">{order.orderId}</p></div>
                    <div className="text-right"><p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p><p className="font-bold capitalize text-primary">{order.status}</p></div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Tracking number</p><p className="font-mono font-bold">{order.trackingId}</p></div>
                    <p className="font-display text-xl font-bold">₹{order.total.toLocaleString()}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-lg rounded-[28px] border border-border bg-card p-8 shadow-card sm:p-12">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound size={28} /></div>
        <h1 className="text-center font-display text-3xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-3 text-center text-muted-foreground">An account is required before placing an order.</p>
        {mode === "signup" && <label className="mt-6 block text-sm font-medium">Name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>}
        <label className="mt-4 block text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>
        {mode === "signup" && <label className="mt-4 block text-sm font-medium">Phone<input required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>}
        <label className="mt-4 block text-sm font-medium">Password<input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3" /></label>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <button className="mt-6 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground">{mode === "signup" ? "Create account" : "Sign in"}</button>
        <button type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }} className="mt-4 w-full text-sm font-medium text-primary">{mode === "signup" ? "Already have an account? Sign in" : "Need an account? Create one"}</button>
      </form>
    </div>
  );
}
