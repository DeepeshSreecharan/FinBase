// src/pages/Dashboard.tsx
import { Footer } from "@/components/Layout/Footer";
import { Header } from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroButton } from "@/components/ui/hero-button";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  status: string;
}

interface Account {
  id?: string;
  accountNumber: string;
  accountType?: string;
  type?: string;
  balance: number;
  [k: string]: any;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userData, setUserData] = useState<any>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accountDetails, setAccountDetails] = useState<Account | null>(null);

  // Fetch fresh account & transaction data
  const fetchAccountData = useCallback(async () => {
    const token = localStorage.getItem("cbiusertoken");
    if (!token) return;

    setRefreshing(true);
    try {
      // --- Fetch account details via apiService ---
      const accountRes = await apiService.getBalance();
      const acc = accountRes?.account || accountRes;
      if (acc && acc.accountNumber) {
        setAccountDetails(acc as Account);

        // Update localStorage user data safely
        try {
          const userDataStr = localStorage.getItem("cbiuserdata");
          if (userDataStr) {
            const user = JSON.parse(userDataStr);
            user.accounts = user.accounts || [];
            const index = user.accounts.findIndex((a: any) => a.accountNumber === acc.accountNumber);
            if (index >= 0) user.accounts[index].balance = acc.balance;
            else user.accounts.push({
              id: acc.accountNumber,
              accountNumber: acc.accountNumber,
              type: acc.accountType || acc.type || "savings",
              balance: acc.balance,
            });
            localStorage.setItem("cbiuserdata", JSON.stringify(user));
            setUserData(user);
          }
        } catch (err) {
          console.warn("Failed to sync local user data:", err);
        }
      }

      // --- Fetch latest transactions via apiService ---
      const transRes = await apiService.getTransactions({ limit: 5 });
      const transList = transRes?.transactions || transRes?.data || [];
      const formatted = (transList || []).map((t: any) => ({
        id: t._id || t.id,
        type: (t.type || "debit").toLowerCase(),
        amount: t.amount,
        description: t.description || t.narration || "Transaction",
        date: new Date(t.createdAt || t.date || Date.now()).toLocaleDateString(),
        status: t.status || "Completed",
      })) as Transaction[];
      setTransactions(formatted);
    } catch (err: any) {
      console.error("❌ Error fetching dashboard data:", err);
      // show a single toast on error (avoid spamming)
      toast({
        title: "Data fetch error",
        description: err.message || "Unable to fetch account/transaction data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  // On mount: verify login & load initial data
  useEffect(() => {
    const token = localStorage.getItem("cbiusertoken");
    const userDataStr = localStorage.getItem("cbiuserdata");

    if (!token || !userDataStr) {
      toast({
        title: "Please login",
        description: "You need to be logged in to access the dashboard.",
        variant: "destructive",
      });
      navigate("/auth/login");
      return;
    }

    try {
      const data = JSON.parse(userDataStr);
      setUserData(data);
      fetchAccountData();
    } catch {
      navigate("/auth/login");
    } finally {
      setLoading(false);
    }
  }, [navigate, toast, fetchAccountData]);

  // Auto refresh when tab regains focus
  useEffect(() => {
    const handleFocus = () => fetchAccountData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchAccountData]);

  // Auto refresh when money is added/deducted
  useEffect(() => {
    const handleRefresh = () => fetchAccountData();
    window.addEventListener("refreshDashboard", handleRefresh);
    return () => window.removeEventListener("refreshDashboard", handleRefresh);
  }, [fetchAccountData]);

  const mockFDs = [
    { id: "fd1", amount: 10000, interestRate: 6.5, maturityDate: "2025-01-15", status: "Active" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!userData) return null;

  const totalBalance =
    accountDetails?.balance ||
    (userData.accounts?.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0) || 0);

  const monthlyStats = transactions.reduce(
    (acc, t) => {
      if (t.type === "credit") acc.credits += t.amount;
      else acc.debits += t.amount;
      return acc;
    },
    { credits: 0, debits: 0 }
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        {/* Welcome + Refresh */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {userData.name}!</h1>
            <p className="text-muted-foreground">Here's your financial overview</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAccountData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-banking-gradient text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Balance</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-white hover:bg-white/20"
              >
                {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{showBalance ? `₹${totalBalance.toLocaleString()}` : "₹••••••"}</div>
              <p className="text-xs opacity-90">Across all accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active FDs</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockFDs.length}</div>
              <p className="text-xs text-muted-foreground">Fixed deposits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                +₹{(monthlyStats.credits - monthlyStats.debits).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Net income</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ATM Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Active cards</p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Accounts</CardTitle>
                  <CardDescription>Manage your savings and current accounts</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <HeroButton size="sm" onClick={() => navigate("/accounts", { state: { mode: "add" } })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Money
                  </HeroButton>
                  <HeroButton size="sm" variant="heroSecondary" onClick={() => navigate("/accounts", { state: { mode: "deduct" } })}>
                    <Plus className="h-4 w-4 mr-2" /> Deduct Money
                  </HeroButton>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountDetails ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{accountDetails.type || accountDetails.accountType} Account</p>
                        <p className="text-sm text-muted-foreground">{accountDetails.accountNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {showBalance ? `₹${totalBalance.toLocaleString()}` : "₹••••••"}
                      </p>
                      <p className="text-sm text-muted-foreground">Available</p>
                    </div>
                  </div>
                ) : (
                  userData.accounts?.map((account: any) => (
                    <div key={account.id || account.accountNumber} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{account.type} Account</p>
                          <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {showBalance ? `₹${(account.balance || 0).toLocaleString()}` : "₹••••••"}
                        </p>
                        <p className="text-sm text-muted-foreground">Available</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Your latest financial activities</CardDescription>
                </div>
                <Button variant="outline" onClick={() => navigate("/transactions")}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.length > 0 ? (
                    transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              t.type === "credit" ? "bg-success/20" : "bg-warning/20"
                            }`}
                          >
                            {t.type === "credit" ? (
                              <ArrowDownRight className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-warning" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{t.description}</p>
                            <p className="text-sm text-muted-foreground">{t.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              t.type === "credit" ? "text-success" : "text-warning"
                            }`}
                          >
                            {t.type === "credit" ? "+" : "-"}₹{t.amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">{t.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No recent transactions found.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & FDs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Frequently used features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <HeroButton className="w-full justify-start" variant="heroSecondary" onClick={() => navigate("/accounts", { state: { mode: "add" } })}>
                  <Plus className="h-4 w-4 mr-2" /> Add Money
                </HeroButton>
                <HeroButton className="w-full justify-start" variant="heroSecondary" onClick={() => navigate("/accounts", { state: { mode: "deduct" } })}>
                  <Plus className="h-4 w-4 mr-2" /> Deduct Money
                </HeroButton>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/fixed-deposits")}>
                  <Shield className="h-4 w-4 mr-2" /> Create Fixed Deposit
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/atm-cards")}>
                  <CreditCard className="h-4 w-4 mr-2" /> Manage ATM Cards
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/contact")}>
                  <Clock className="h-4 w-4 mr-2" /> Contact Support
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fixed Deposits</CardTitle>
                <CardDescription>Your investment overview</CardDescription>
              </CardHeader>
              <CardContent>
                {mockFDs.length > 0 ? (
                  <div className="space-y-4">
                    {mockFDs.map((fd) => (
                      <div key={fd.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">₹{fd.amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{fd.interestRate}% interest</p>
                          </div>
                          <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">
                            {fd.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Matures on {fd.maturityDate}</p>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => navigate("/fixed-deposits")}>
                      View All FDs
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">No fixed deposits yet</p>
                    <HeroButton size="sm" onClick={() => navigate("/fixed-deposits")}>
                      Create Your First FD
                    </HeroButton>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
