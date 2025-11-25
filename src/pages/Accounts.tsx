// src/pages/Accounts.tsx
import { Footer } from "@/components/Layout/Footer";
import { Header } from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [amount, setAmount] = useState<number | "">("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<any>(null);

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
        const res = await fetch("http://localhost:5000/api/amount/balance", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAccount(data);
        } else {
          toast({ title: "Error", description: "Failed to fetch account", variant: "destructive" });
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Server error", variant: "destructive" });
      }
    };

    fetchAccount();
  }, [navigate, toast]);

  // Add / Deduct money
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid amount > 0",
        variant: "destructive",
      });
      return;
    }

    if (!account) {
      toast({ title: "Error", description: "No account found", variant: "destructive" });
      return;
    }

    const token = localStorage.getItem("cbiusertoken");
    if (!token) return;

    setLoading(true);
    setStatus(null);

    try {
      const url = isAddMode
        ? "http://localhost:5000/api/amount/add"
        : "http://localhost:5000/api/amount/deduct";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          accountNumber: account.accountNumber,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: "Success", description: data.message });
        setAccount(data.account);
        setAmount("");
        setStatus("success");

        // Update localStorage
        const userDataStr = localStorage.getItem("cbiuserdata");
        if (userDataStr) {
          const user = JSON.parse(userDataStr);
          user.accounts = user.accounts || [];
          const idx = user.accounts.findIndex(
            (acc: any) => acc.accountNumber === data.account.accountNumber
          );
          if (idx >= 0) user.accounts[idx].balance = data.account.balance;
          else user.accounts.push(data.account);
          localStorage.setItem("cbiuserdata", JSON.stringify(user));
        }

        // Trigger dashboard refresh
        window.dispatchEvent(new Event("refreshDashboard"));
      } else {
        setStatus(data.message || "Operation failed");
      }
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || "Server error");
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

          {account && (
            <div className="p-4 border rounded mb-6 text-center">
              <p>Account Number: {account.accountNumber}</p>
              <p>Balance: ₹{account.balance.toLocaleString()}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded focus:outline-none"
              min={1}
              required
            />
            <button
              type="submit"
              className="w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none"
              disabled={loading}
            >
              {loading
                ? isAddMode
                  ? "Adding..."
                  : "Deducting..."
                : isAddMode
                ? "Add Money"
                : "Deduct Money"}
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
