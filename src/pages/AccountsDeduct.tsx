// src/pages/AccountsDeduct.tsx
import { Footer } from "@/components/Layout/Footer";
import { Header } from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type AccountData = {
  accountNumber: string;
  balance: number;
  [k: string]: any;
};

const AccountsDeduct: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<AccountData | null>(null);

  // Fetch account details
  useEffect(() => {
    const token = localStorage.getItem("cbiusertoken");
    if (!token) {
      navigate("/auth/login");
      return;
    }

    const fetchAccount = async () => {
      try {
        const data = await apiService.getBalance();
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

  const handleDeduct = async () => {
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

    try {
      const payload = {
        amount: Number(amount),
        accountNumber: account.accountNumber,
      };

      const result = await apiService.deductMoney(payload);

      const updatedAccount = result?.account || result?.data || result;
      if (updatedAccount && updatedAccount.accountNumber) {
        setAccount(updatedAccount as AccountData);
        setAmount("");
        toast({ title: "Success", description: result.message || "Amount deducted" });

        // update localStorage safely
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

        // notify dashboard
        window.dispatchEvent(new Event("refreshDashboard"));
      } else {
        toast({ title: "Warning", description: result?.message || "Operation completed" });
      }
    } catch (err: any) {
      console.error("handleDeduct error:", err);
      toast({
        title: "Error",
        description: err.message || "Server error while deducting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-16 max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Deduct Money</h1>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        {account ? (
          <div className="p-4 border rounded mb-6">
            <p className="font-medium">Account Number: {account.accountNumber}</p>
            <p className="text-lg font-semibold mt-1">Balance: ₹{account.balance.toLocaleString()}</p>
          </div>
        ) : (
          <p>Loading account details...</p>
        )}

        <input
          type="number"
          placeholder="Enter amount to deduct"
          className="w-full p-3 border rounded mb-4"
          value={amount}
          onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
          min={1}
        />
        <Button className="w-full" onClick={handleDeduct} disabled={loading}>
          {loading ? "Processing..." : "Deduct Money"}
        </Button>
      </div>
      <Footer />
    </div>
  );
};

export default AccountsDeduct;
