import { Footer } from '@/components/Layout/Footer';
import { Header } from '@/components/Layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import apiService from '@/lib/api';
import { CreditCard, Eye, EyeOff, Lock, Plus, Unlock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ATMCard {
  id: string;
  cardNumber: string;
  cardType: string;
  status: string;
  expiryDate: string;
  isBlocked: boolean;
  pinSet: boolean;
}

const ATMCards = () => {
  const [cards, setCards] = useState<ATMCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [showPin, setShowPin] = useState(false);
  const navigate = useNavigate();

  const [requestForm, setRequestForm] = useState({
    cardType: 'debit',
    deliveryAddress: ''
  });

  const [pinForm, setPinForm] = useState({
    pin: '',
    confirmPin: ''
  });

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await apiService.getATMCards();
      setCards(response.cards);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load ATM cards",
        variant: "destructive",
      });
    }
  };

  const handleRequestCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiService.requestATMCard(requestForm);
      toast({
        title: "Success",
        description: "Your card will be delivered in a week.",
      });
      setShowRequestForm(false);
      setRequestForm({ cardType: 'debit', deliveryAddress: '' });

      setSelectedCard(response.card.id);
      setShowPinForm(true);
      fetchCards();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request card",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinForm.pin !== pinForm.confirmPin) {
      toast({ title: "Error", description: "PINs do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiService.setATMPin({ cardId: selectedCard, pin: pinForm.pin, confirmPin: pinForm.confirmPin });
      toast({ title: "Success", description: "PIN set successfully" });
      setShowPinForm(false);
      setPinForm({ pin: '', confirmPin: '' });
      fetchCards();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set PIN",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (cardId: string, action: 'block' | 'unblock') => {
    try {
      await apiService.toggleBlockCard(cardId, action);
      toast({
        title: "Success",
        description: `Card ${action}ed successfully`,
      });
      fetchCards();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} card`,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ★ Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </Button>
      </div>

      <main className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">ATM Cards</h1>

          <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Request New Card
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request New ATM Card</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleRequestCard} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardType">Card Type</Label>
                  <Input value="Debit Card" disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Textarea
                    id="deliveryAddress"
                    value={requestForm.deliveryAddress}
                    onChange={(e) => setRequestForm({ ...requestForm, deliveryAddress: e.target.value })}
                    placeholder="Enter delivery address"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Requesting..." : "Request Card"}
                  </Button>
                  <Button variant="outline" type="button" onClick={() => setShowRequestForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards List */}
        <div className="grid gap-6">
          {cards.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No ATM Cards</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any ATM cards yet.
                </p>
                <Button onClick={() => setShowRequestForm(true)}>
                  Request Your First Card
                </Button>
              </CardContent>
            </Card>
          ) : (
            cards.map((card) => (
              <Card key={card.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {card.cardType.toUpperCase()} Card
                      </CardTitle>
                      <p className="text-muted-foreground mt-1">{card.cardNumber}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(card.status)}>
                        {card.status.toUpperCase()}
                      </Badge>
                      {card.isBlocked && <Badge variant="destructive">BLOCKED</Badge>}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Expiry Date</p>
                        <p className="font-medium">
                          {new Date(card.expiryDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">PIN Status</p>
                        <p className="font-medium">{card.pinSet ? 'Set' : 'Not Set'}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!card.pinSet && card.status === 'delivered' && (
                        <Dialog open={showPinForm} onOpenChange={setShowPinForm}>
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => setSelectedCard(card.id)}>
                              Set PIN
                            </Button>
                          </DialogTrigger>

                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Set ATM PIN</DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleSetPin} className="space-y-4">
                              <div className="space-y-2">
                                <Label>New PIN</Label>
                                <Input
                                  type="password"
                                  maxLength={4}
                                  value={pinForm.pin}
                                  onChange={(e) => setPinForm({ ...pinForm, pin: e.target.value })}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Confirm PIN</Label>
                                <Input
                                  type="password"
                                  maxLength={4}
                                  value={pinForm.confirmPin}
                                  onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value })}
                                  required
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button type="submit" disabled={loading}>
                                  {loading ? "Setting..." : "Set PIN"}
                                </Button>
                                <Button variant="outline" onClick={() => setShowPinForm(false)}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}

                      {card.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant={card.isBlocked ? "default" : "destructive"}
                            onClick={() => handleToggleBlock(card.id, card.isBlocked ? 'unblock' : 'block')}
                          >
                            {card.isBlocked ? <Unlock className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />}
                            {card.isBlocked ? 'Unblock' : 'Block'}
                          </Button>

                          <Button size="sm" variant="outline" onClick={() => setShowPin(!showPin)}>
                            {showPin ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                            {showPin ? 'Hide' : 'Show'} Details
                          </Button>

                          <Button size="sm" variant="outline" onClick={() => navigate("/accounts")}>
                            Add / Withdraw Money
                          </Button>

                          <Button size="sm" variant="outline" onClick={() => navigate("/transactions")}>
                            Transactions
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ATMCards;
