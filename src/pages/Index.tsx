import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  Target,
  ChevronRight,
  Award,
  BookOpen
} from "lucide-react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeatureGrid from "@/components/FeatureGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeatureGrid />
      
      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-br from-background to-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-4">
              Empowering Tayum's Youth Leadership
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Supporting sustainable development goals through transparent governance and youth engagement
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center p-6 shadow-card">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">21</h3>
              <p className="text-muted-foreground">Barangay SK Units</p>
            </Card>
            
            <Card className="text-center p-6 shadow-card">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-lg mb-4">
                <Target className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">100%</h3>
              <p className="text-muted-foreground">Transparency Goal</p>
            </Card>
            
            <Card className="text-center p-6 shadow-card">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mb-4">
                <Award className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">SDG 16</h3>
              <p className="text-muted-foreground">Peace & Justice</p>
            </Card>
            
            <Card className="text-center p-6 shadow-card">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">SDG 17</h3>
              <p className="text-muted-foreground">Partnerships</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">
            Ready to Transform Youth Governance?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Join SKey Connect and be part of building transparent, accountable youth leadership in Tayum, Abra.
          </p>
          <Link to="/survey">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Take the Survey
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;