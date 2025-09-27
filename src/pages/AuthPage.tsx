import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Shield, Users, Calendar } from 'lucide-react';


const AuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome!",
        description: "Successfully logged in to SK Tayum System",
      });
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  };


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-br from-background/30 via-transparent to-background/20" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-xl" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-card rounded-full flex items-center justify-center shadow-primary">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-card">SK Tayum System</h1>
              <p className="text-card/80 mt-2">Administrative Portal</p>
            </div>
          </div>

          {/* Features preview */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-card/20 rounded-lg flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-card" />
              </div>
              <p className="text-xs text-card/70">User Management</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-card/20 rounded-lg flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6 text-card" />
              </div>
              <p className="text-xs text-card/70">Event Planning</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-card/20 rounded-lg flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-card" />
              </div>
              <p className="text-xs text-card/70">Secure Portal</p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="backdrop-blur-sm bg-card/95 shadow-primary border-0">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center text-foreground">Welcome Back</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Sign in to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-muted focus:border-primary"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50 border-muted focus:border-primary pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-soft" 
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Need an account? Contact your administrator
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};


export default AuthPage;