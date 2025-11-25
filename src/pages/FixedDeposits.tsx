// src/pages/FixedDeposits.tsx
import { Footer } from '@/components/Layout/Footer';
import { Header } from '@/components/Layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/lib/api';
import { Calendar, PiggyBank, Plus, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FixedDeposit {
  id: string;
  amount: number;
  tenure: number;
  interestRate: number;
  maturityAmount: number;
  startDate: string;
  maturityDate: string;
  status: string;
}

const FixedDeposits: React.FC = () => {
  const navigate = useNavigate();
  const [fds, setFds] = useState<FixedDeposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fdForm, setFdForm] = useState({ amount: '', tenure: '' });

  useEffect(() => {
    fetchFDs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFDs = async () => {
    setLoading(true);
    try {
      const res: any = await apiService.getFDs();
      const items = Array.isArray(res?.fds) ? res.fds : [];
      setFds(
        items.map((fd: any) => ({
          id: fd.id || fd._id,
          amount: fd.amount,
          tenure: fd.tenure,
          interestRate: fd.interestRate,
          maturityAmount: fd.maturityAmount,
          startDate: fd.startDate,
          maturityDate: fd.maturityDate,
          status: fd.status,
        }))
      );
    } catch (err: any) {
      console.error('Fixed Deposits fetch failed:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load Fixed Deposits',
        variant: 'destructive',
      });
      setFds([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateInterestRate = (tenure: number) => {
    if (tenure <= 12) return 6.5;
    if (tenure <= 24) return 7.0;
    if (tenure <= 36) return 7.5;
    return 8.0;
  };

  const calculateMaturityAmount = (amount: number, tenure: number) => {
    const rate = calculateInterestRate(tenure);
    return amount * Math.pow(1 + rate / 100, tenure / 12);
  };

  const handleCreateFD = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.createFD({
        amount: parseFloat(fdForm.amount),
        tenure: parseInt(fdForm.tenure, 10),
      });

      toast({
        title: 'Success',
        description: 'Fixed Deposit created successfully',
      });
      setShowCreateForm(false);
      setFdForm({ amount: '', tenure: '' });
      fetchFDs();
    } catch (error: any) {
      console.error('Create FD error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create FD',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBreakFD = async (fdId: string) => {
    if (!window.confirm('Are you sure you want to break this FD? You may lose some interest.')) return;
    try {
      await apiService.breakFD(fdId);
      toast({
        title: 'Success',
        description: 'Fixed Deposit broken successfully',
      });
      fetchFDs();
    } catch (error: any) {
      console.error('Break FD error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to break FD',
        variant: 'destructive',
      });
    }
  };

  const getProgress = (startDate: string, maturityDate: string) => {
    const start = new Date(startDate).getTime();
    const end = new Date(maturityDate).getTime();
    const now = new Date().getTime();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getDaysRemaining = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'matured':
        return 'bg-blue-100 text-blue-800';
      case 'broken':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Top toolbar with Back button */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </Button>
        </div>
        <div>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New FD
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <main className="container mx-auto px-4 py-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Fixed Deposits</h1>
        </div>

        {/* Create Dialog (placed here so Trigger can live in top toolbar) */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent aria-describedby="fd-dialog-desc" className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Fixed Deposit</DialogTitle>
              <p id="fd-dialog-desc" className="sr-only">Form to create a fixed deposit</p>
            </DialogHeader>
            <form onSubmit={handleCreateFD} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1000"
                  step="100"
                  value={fdForm.amount}
                  onChange={(e) => setFdForm({ ...fdForm, amount: e.target.value })}
                  placeholder="Minimum ₹1,000"
                  required
                />
                <p className="text-xs text-muted-foreground">Minimum amount: ₹1,000</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenure">Tenure (Months)</Label>
                <Select value={fdForm.tenure} onValueChange={(value) => setFdForm({ ...fdForm, tenure: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 Months (6.5% p.a.)</SelectItem>
                    <SelectItem value="12">12 Months (6.5% p.a.)</SelectItem>
                    <SelectItem value="18">18 Months (7.0% p.a.)</SelectItem>
                    <SelectItem value="24">24 Months (7.0% p.a.)</SelectItem>
                    <SelectItem value="36">36 Months (7.5% p.a.)</SelectItem>
                    <SelectItem value="60">60 Months (8.0% p.a.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {fdForm.amount && fdForm.tenure && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Calculation Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Principal Amount:</span>
                      <span>₹{parseFloat(fdForm.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Rate:</span>
                      <span>{calculateInterestRate(parseInt(fdForm.tenure, 10))}% p.a.</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tenure:</span>
                      <span>{fdForm.tenure} months</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Maturity Amount:</span>
                      <span>₹{calculateMaturityAmount(parseFloat(fdForm.amount), parseInt(fdForm.tenure, 10)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create FD'}</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Interest Rate Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Interest Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold">6-12 Months</h3>
                <p className="text-2xl font-bold text-primary">6.5%</p>
                <p className="text-sm text-muted-foreground">per annum</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold">13-24 Months</h3>
                <p className="text-2xl font-bold text-primary">7.0%</p>
                <p className="text-sm text-muted-foreground">per annum</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold">25-36 Months</h3>
                <p className="text-2xl font-bold text-primary">7.5%</p>
                <p className="text-sm text-muted-foreground">per annum</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-semibold">37+ Months</h3>
                <p className="text-2xl font-bold text-primary">8.0%</p>
                <p className="text-sm text-muted-foreground">per annum</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-16 text-lg font-medium">Loading...</div>
          ) : fds.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <PiggyBank className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Fixed Deposits</h3>
                <p className="text-muted-foreground mb-4">
                  Start growing your money with our competitive interest rates.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>Create Your First FD</Button>
              </CardContent>
            </Card>
          ) : (
            fds.map((fd) => {
              const progress = getProgress(fd.startDate, fd.maturityDate);
              const daysRemaining = getDaysRemaining(fd.maturityDate);
              return (
                <Card key={fd.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <PiggyBank className="h-5 w-5" />
                          Fixed Deposit #{fd.id?.slice(-6)}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1">
                          Created on {new Date(fd.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(fd.status)}>{fd.status.toUpperCase()}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Principal</p>
                          <p className="text-xl font-bold">₹{fd.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Interest Rate</p>
                          <p className="text-xl font-bold">{fd.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tenure</p>
                          <p className="text-xl font-bold">{fd.tenure} months</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Maturity Amount</p>
                          <p className="text-xl font-bold text-green-600">₹{fd.maturityAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      {fd.status === 'active' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(progress)}% Complete</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Started: {new Date(fd.startDate).toLocaleDateString()}</span>
                            <span>Matures: {new Date(fd.maturityDate).toLocaleDateString()}</span>
                          </div>
                          <p className="text-center text-sm">
                            <Calendar className="inline h-4 w-4 mr-1" />
                            {daysRemaining} days remaining
                          </p>
                        </div>
                      )}

                      {fd.status === 'active' && (
                        <div className="flex gap-2">
                          <Button variant="destructive" size="sm" onClick={() => handleBreakFD(fd.id)}>
                            Break FD (Penalty applies)
                          </Button>
                        </div>
                      )}

                      {fd.status === 'matured' && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-green-800 font-semibold">
                            🎉 Congratulations! Your FD has matured.
                          </p>
                          <p className="text-green-700 text-sm">
                            Amount of ₹{fd.maturityAmount.toLocaleString()} has been credited to your account.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FixedDeposits;
