import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CustomerAccount = { name: string; email: string; phone: string; password: string };
type AccountContextType = { account: CustomerAccount | null; signUp: (account: CustomerAccount) => string | null; signIn: (email: string, password: string) => string | null; signOut: () => void };

const ACCOUNT_KEY = "coolman-customer-account";
const SESSION_KEY = "coolman-customer-session";
const AccountContext = createContext<AccountContextType | null>(null);

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount must be used within AccountProvider");
  return context;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<CustomerAccount | null>(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (account) localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    else localStorage.removeItem(SESSION_KEY);
  }, [account]);

  const signUp = (newAccount: CustomerAccount) => {
    const normalizedEmail = newAccount.email.trim().toLowerCase();
    if (!newAccount.name.trim() || !normalizedEmail || newAccount.password.length < 6) return "Enter your name, email, and a password of at least 6 characters.";
    const existing = localStorage.getItem(ACCOUNT_KEY);
    if (existing && (JSON.parse(existing) as CustomerAccount).email === normalizedEmail) return "An account already exists for this email.";
    const saved = { ...newAccount, email: normalizedEmail };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(saved));
    setAccount(saved);
    return null;
  };

  const signIn = (email: string, password: string) => {
    const stored = localStorage.getItem(ACCOUNT_KEY);
    const saved = stored ? (JSON.parse(stored) as CustomerAccount) : null;
    if (!saved || saved.email !== email.trim().toLowerCase() || saved.password !== password) return "Incorrect email or password. Create an account first if you are new here.";
    setAccount(saved);
    return null;
  };

  return <AccountContext.Provider value={{ account, signUp, signIn, signOut: () => setAccount(null) }}>{children}</AccountContext.Provider>;
}