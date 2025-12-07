import bankingHero from "@/assets/banking-hero.jpg"
import kidsBanking from "@/assets/kids-banking.jpg"
import securityIcon from "@/assets/security-icon.jpg"
import { Footer } from "@/components/Layout/Footer"
import { Header } from "@/components/Layout/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HeroButton } from "@/components/ui/hero-button"
import { Award, ChevronRight, CreditCard, Phone, Shield, Smartphone, TrendingUp, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"

const Index = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: CreditCard,
      title: "Digital Banking",
      description: "Modern banking solutions designed specifically for children and young adults",
      image: securityIcon
    },
    {
      icon: Shield,
      title: "Fixed Deposits",
      description: "Secure savings with attractive interest rates to help children grow their money",
      image: securityIcon
    },
    {
      icon: Smartphone,
      title: "Virtual ATM Cards",
      description: "Safe and secure virtual cards for online transactions and learning",
      image: securityIcon
    },
    {
      icon: TrendingUp,
      title: "Financial Education",
      description: "Learn about money management, savings, and responsible spending habits",
      image: kidsBanking
    }
  ]

  const stats = [
    { number: "50,000+", label: "Young Customers" },
    { number: "₹10 Cr+", label: "Savings Secured" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-banking-hero min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/50" />
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Banking Made 
                  <span className="bg-banking-gradient bg-clip-text text-transparent"> Simple</span>
                  <br />
                  for Young Minds
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  CBI Bank helps children learn financial responsibility through safe, secure, and educational banking experiences.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <HeroButton 
                  size="lg"
                  onClick={() => navigate('/auth/register')}
                  className="animate-glow"
                >
                  Open Your Account
                  <ChevronRight className="h-5 w-5" />
                </HeroButton>
                <HeroButton 
                  variant="heroSecondary" 
                  size="lg"
                  onClick={() => navigate('/contact')}
                >
                  Learn More
                </HeroButton>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-primary">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={bankingHero} 
                alt="Banking Hero" 
                className="w-full h-auto rounded-2xl shadow-banking animate-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose CBI Bank?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We provide comprehensive banking solutions designed to teach financial literacy while keeping your money safe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-banking transition-all duration-300 hover:-translate-y-2">
                <CardHeader className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full bg-banking-gradient p-4 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Educational Section */}
      <section className="py-24">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Financial Education
                  <span className="block text-primary">That Matters</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Our platform combines practical banking with educational content to help children understand the value of money, saving, and responsible spending.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                    <Award className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Safe Learning Environment</h4>
                    <p className="text-sm text-muted-foreground">Controlled environment for learning without financial risks</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Parental Oversight</h4>
                    <p className="text-sm text-muted-foreground">Parents can monitor and guide their children's financial journey</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Skill Development</h4>
                    <p className="text-sm text-muted-foreground">Build essential life skills through hands-on banking experience</p>
                  </div>
                </div>
              </div>
              
              <HeroButton size="lg" onClick={() => navigate('/auth/register')}>
                Start Learning Today
              </HeroButton>
            </div>
            
            <div className="relative">
              <img 
                src={kidsBanking} 
                alt="Kids Learning Banking" 
                className="w-full h-auto rounded-2xl shadow-banking"
              />
              <div className="absolute inset-0 bg-banking-gradient/10 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-banking-gradient">
        <div className="container text-center">
          <div className="space-y-8 text-white">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Your Banking Journey?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Join thousands of young customers who are already learning valuable financial skills with CBI Bank.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <HeroButton 
                variant="heroSecondary" 
                size="lg"
                onClick={() => navigate('/auth/register')}
                className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary"
              >
                Create Account
              </HeroButton>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/contact')}
                className=" border-gray-300 text-gray-700 hover:bg-gray-100
    dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
