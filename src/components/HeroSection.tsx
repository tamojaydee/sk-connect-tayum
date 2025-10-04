import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  Shield, 
  Globe, 
  Users,
  CheckCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/tayum1.jpg";

const HeroSection = () => {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="SKey Connect - Youth Leadership Platform" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-background/90 to-secondary/80"></div>
      </div>
      
      <div className="container mx-auto px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
            <Globe className="mr-2 h-3 w-3" />
            Supporting SDG 16 & 17
          </Badge>
          
          {/* Main headline */}
          <h1 className="text-4xl lg:text-6xl font-heading font-bold text-foreground mb-6 leading-tight">
            SKey Connect:
            <span className="block text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text">
              Empowering Young Leaders
            </span>
            Through Transparency
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            A modern platform for Sangguniang Kabataan officials in Tayum, Abra to manage leadership profiles, 
            track engagement, and promote transparent governance.
          </p>
          
          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <span>Leadership Profiles</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <span>Budget Transparency</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <span>Project Tracking</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-secondary" />
              <span>Community Engagement</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/survey">
              <Button size="lg" className="bg-primary hover:bg-primary-hover text-lg px-8 py-3 shadow-primary w-full">
                <Users className="mr-2 h-5 w-5" />
                Take the Survey
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3 border-primary/20 hover:bg-primary/5"
              onClick={() => {
                const element = document.getElementById('transparency');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <Shield className="mr-2 h-5 w-5" />
              Learn About Transparency
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Trusted by youth leaders across Tayum</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-xs font-medium">DILG Certified</div>
              <div className="text-xs font-medium">LYDO Approved</div>
              <div className="text-xs font-medium">Barangay Integrated</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;