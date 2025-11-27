// src/pages/Accounts.tsx
import { Footer } from "@/components/Layout/Footer";
import { Header } from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type AccountData = {
  accountNumber: string;
  balance: number;
  [k: string]: any;
};

const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [amount, setAmount] = useState<number | "">("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<AccountData | null>(null);

  const isAddMode = location.state?.mode !== "deduct";

  // Fetch current balance
  useEffect(() => {
    const token = localStorage.getItem("cbiusertoken");
    if (!token) {
      navigate("/auth/login");
      return;
    }

    const fetchAccount = async () => {
      try {
        const data = await apiService.getBalance();
        // backend response shape may vary; try common shapes
        // prefer data.account, fallback to data
        const acc = (data && (data.account || data)) as AccountData;
        if (acc && acc.accountNumber) {
          setAccount(acc);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch account details",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error("fetchAccount error:", err);
        toast({
          title: "Error",
          description: err.message || "Server error while fetching account",
          variant: "destructive",
        });
      }
    };

    fetchAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Add / Deduct money
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount === "" || Number(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!account) {
      toast({
        title: "Error",
        description: "No account found",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const payload = {
        amount: Number(amount),
        accountNumber: account.accountNumber,
      };

      let result: any;
      if (isAddMode) {
        result = await apiService.addMoney(payload);
      } else {
        result = await apiService.deductMoney(payload);
      }

      // result expected to include updated account or message
      const updatedAccount = result?.account || result?.data || result;
      if (updatedAccount && updatedAccount.accountNumber) {
        setAccount(updatedAccount as AccountData);
        setAmount("");
        setStatus("success");

        toast({ title: "Success", description: result.message || "Operation successful" });

        // Update localStorage.user data safely
        try {
          const userDataStr = localStorage.getItem("cbiuserdata");
          if (userDataStr) {
            const user = JSON.parse(userDataStr);
            user.accounts = user.accounts || [];
            const idx = user.accounts.findIndex(
              (acc: any) => acc.accountNumber === updatedAccount.accountNumber
            );
            if (idx >= 0) user.accounts[idx].balance = updatedAccount.balance;
            else user.accounts.push(updatedAccount);
            localStorage.setItem("cbiuserdata", JSON.stringify(user));
          }
        } catch (err) {
          console.warn("Failed to update local user data:", err);
        }

        // Notify dashboard to refresh
        window.dispatchEvent(new Event("refreshDashboard"));
      } else {
        setStatus(result?.message || "Operation completed but no account returned");
      }
    } catch (err: any) {
      console.error("handleSubmit error:", err);
      const msg = err?.message || "Server error";
      setStatus(msg);
      toast({ title: "Operation failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* TOP BACK BUTTON */}
      <div className="container mt-6">
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center py-12">
        <div className="bg-white shadow rounded-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            {isAddMode ? "Add Money" : "Deduct Money"}
          </h2>

          {account ? (
            <div className="p-4 border rounded mb-6 text-center">
              <p className="font-medium">Account Number: {account.accountNumber}</p>
              <p className="text-lg font-semibold mt-1">Balance: ₹{account.balance.toLocaleString()}</p>
            </div>
          ) : (
            <div className="p-4 border rounded mb-6 text-center text-muted-foreground">
              Loading account...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                setAmount(val === "" ? "" : Number(val));
              }}
              className="w-full px-3 py-2 border rounded focus:outline-none"
              min={1}
              required
            />
            <button
              type="submit"
              className="w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none disabled:opacity-60"
              disabled={loading}
            >
              {loading ? (isAddMode ? "Adding..." : "Deducting...") : isAddMode ? "Add Money" : "Deduct Money"}
            </button>
          </form>

          {status === "success" && (
            <div className="text-green-600 text-center mt-4">Operation successful!</div>
          )}
          {status && status !== "success" && (
            <div className="text-red-500 text-center mt-4">{status}</div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Accounts;
