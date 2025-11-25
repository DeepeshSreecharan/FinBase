// src/pages/Login.tsx
import { Footer } from "@/components/Layout/Footer";
import { Header } from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroButton } from "@/components/ui/hero-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // normalize email (important — registration lowercases email on the server).
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password // do NOT trim password (users may intentionally have spaces)
      };

      // quick client-side checks
      if (!payload.email || !payload.password) {
        toast({ title: "Missing fields", description: "Please enter email and password", variant: "destructive" });
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Read server body safely (it returns JSON for validation/errors)
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.token) {
        localStorage.setItem('cbiusertoken', data.token);
        if (data.user) localStorage.setItem('cbiuserdata', JSON.stringify(data.user));

        toast({
          title: "Welcome back!",
          description: "You have successfully logged in to your CBI Bank account.",
        });

        navigate('/dashboard');
      } else {
        // If validation or auth failed, show server-provided message(s)
        const serverMsg = data.message || "Please check your credentials and try again.";

        // If the server returned validation errors array (validation.middleware shape), show first few
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          data.errors.slice(0, 3).forEach((err: any) => {
            toast({ title: err.field || "Validation", description: err.message, variant: "destructive" });
          });
        } else {
          toast({ title: "Login failed", description: serverMsg, variant: "destructive" });
        }

        throw new Error(serverMsg);
      }
    } catch (error: any) {
      // Already displayed the server message above; this ensures unexpected errors are also shown
      if (!error?.message) {
        toast({ title: "Login failed", description: "Unexpected error. Check server logs.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-16">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          <Card className="shadow-banking">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your CBI Bank account to continue your financial journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="link" className="px-0 text-sm">
                    Forgot password?
                  </Button>
                </div>
                <HeroButton
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </HeroButton>
              </form>
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Button
                    variant="link"
                    className="px-0 text-primary"
                    onClick={() => navigate('/auth/register')}
                  >
                    Create Account
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6 bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">Demo Credentials</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Email: demo@cbibank.in</p>
                <p>Password: demo123</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
