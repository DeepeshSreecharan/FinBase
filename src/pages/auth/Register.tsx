// src/pages/Register.tsx
import { Footer } from "@/components/Layout/Footer";
import { Header } from "@/components/Layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { HeroButton } from "@/components/ui/hero-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Eye, EyeOff, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MIN_PASSWORD_LENGTH = 6;
const MIN_AGE = 18;

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: ""
  });

  // compute today's date for max attribute in yyyy-mm-dd
  const todayIso = new Date().toISOString().slice(0, 10);

  const calculateAge = (isoDate: string) => {
    if (!isoDate) return 0;
    const dob = new Date(isoDate);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  };

  const normalizePhone = (raw: string) => {
    if (!raw) return "";
    // remove plus, spaces, dashes, parentheses
    let s = raw.replace(/^\+?91/, ""); // remove leading +91 if present
    s = s.replace(/[^\d]/g, ""); // keep digits only
    return s;
  };

  const isValidIndianPhone = (phone: string) => {
    return /^[6-9]\d{9}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic client-side validation
      const name = formData.name.trim();
      const email = formData.email.trim().toLowerCase();
      const address = formData.address.trim();
      const phone = normalizePhone(formData.phone);
      const dob = formData.dateOfBirth;
      const password = formData.password;
      const confirmPassword = formData.confirmPassword;

      if (!name || name.length < 2) {
        throw new Error("Please enter your full name (at least 2 characters).");
      }

      // basic email regex check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        throw new Error("Please enter a valid email address.");
      }

      if (!phone || !isValidIndianPhone(phone)) {
        throw new Error("Please enter a valid 10-digit Indian phone number (no +91 prefix).");
      }

      if (!address) {
        throw new Error("Address is required.");
      }

      if (!dob) {
        throw new Error("Date of Birth is required.");
      }

      const age = calculateAge(dob);
      if (age < MIN_AGE) {
        throw new Error(`You must be at least ${MIN_AGE} years old to register.`);
      }

      if (!password || password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      if (!agreedToTerms) {
        throw new Error("Please agree to the Terms and Conditions and Privacy Policy.");
      }

      // build payload exactly as backend expects
      const payload = {
        name,
        email,
        phone, // normalized digits
        address,
        dateOfBirth: dob, // iso yyyy-mm-dd is fine for backend
        password,
        // confirmPassword not required by backend but harmless if included
        confirmPassword,
        agreedToTerms: true
      };

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.token) {
        // save token & user data
        localStorage.setItem("cbiusertoken", data.token);
        if (data.user) localStorage.setItem("cbiuserdata", JSON.stringify(data.user));

        toast({
          title: "Welcome to CBI Bank!",
          description: "Your account has been created successfully. You can now start your banking journey.",
        });

        navigate("/dashboard");
        return;
      }

      // handle validation errors from server if present
      if (data && data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        data.errors.slice(0, 5).forEach((err: any) => {
          toast({
            title: err.field || "Validation error",
            description: err.message || JSON.stringify(err),
            variant: "destructive"
          });
        });
        throw new Error(data.message || "Validation failed");
      }

      // fallback server message
      throw new Error(data.message || "Registration failed. Please check your details and try again.");
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err.message || "Please check your details and try again.",
        variant: "destructive"
      });
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
            <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <Card className="shadow-banking">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Join CBI Bank</CardTitle>
              <CardDescription>Create your account and start your financial journey with us</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
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

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Enter 10-digit number (no +91). We'll normalize it.</p>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      type="text"
                      placeholder="Your address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth (modernized) */}
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    {/* native date input with max set to today for convenience */}
                    <Input
                      id="dob"
                      type="date"
                      max={todayIso}
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You must be at least {MIN_AGE} years old.
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Button variant="link" className="px-0 text-primary h-auto">Terms and Conditions</Button>
                    {" "}and{" "}
                    <Button variant="link" className="px-0 text-primary h-auto">Privacy Policy</Button>
                  </Label>
                </div>

                <HeroButton type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </HeroButton>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Button variant="link" className="px-0 text-primary" onClick={() => navigate('/auth/login')}>
                    Sign In
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;
