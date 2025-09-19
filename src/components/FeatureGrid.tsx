import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  FileText, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  Shield,
  ChevronRight,
  UserCheck,
  TrendingUp,
  Clock
} from "lucide-react";

const FeatureGrid = () => {
  const features = [
    {
      icon: Users,
      title: "Leadership Profiles",
      description: "Centralized records of youth leaders with personal info, training history, and performance tracking.",
      color: "primary",
      benefits: ["Profile management", "Training records", "Performance metrics"]
    },
    {
      icon: FileText,
      title: "Document Management", 
      description: "Upload and manage official reports, activity logs, resolutions, and project documentation.",
      color: "secondary",
      benefits: ["File organization", "Version control", "Easy access"]
    },
    {
      icon: DollarSign,
      title: "Budget Transparency",
      description: "Track project budgets, financial allocations, and display transparent spending records.",
      color: "accent",
      benefits: ["Financial tracking", "Transparent reporting", "Budget analysis"]
    },
    {
      icon: Calendar,
      title: "Event & Program Tracker",
      description: "Calendar and announcements for community activities including sports, education, and environment.",
      color: "primary",
      benefits: ["Event planning", "Community engagement", "Activity tracking"]
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Real-time charts on participation, budget usage, project status, and community impact.",
      color: "secondary",
      benefits: ["Data visualization", "Performance insights", "Impact measurement"]
    },
    {
      icon: Shield,
      title: "Role-Based Security",
      description: "Secure access control for DILG, LYDO, SK officials, and community members with proper permissions.",
      color: "accent",
      benefits: ["Access control", "Data security", "User management"]
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            Comprehensive Youth Governance Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage transparent, accountable youth leadership in one integrated platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="relative group hover:shadow-lg transition-all duration-300 border-0 shadow-card">
              <CardHeader className="pb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                  feature.color === 'primary' ? 'bg-primary/10 text-primary' :
                  feature.color === 'secondary' ? 'bg-secondary/10 text-secondary' :
                  'bg-accent/10 text-accent'
                }`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-heading font-semibold">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
                
                <div className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center space-x-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                      <span className="text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`w-full justify-between group-hover:bg-${feature.color}/5 transition-colors`}
                >
                  Learn More
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Stats section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Multi-Role Support</h3>
            <p className="text-muted-foreground">DILG, LYDO, SK Officials, and Youth members with appropriate access levels</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-full mb-4">
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Performance Tracking</h3>
            <p className="text-muted-foreground">Monitor leadership effectiveness and community impact in real-time</p>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
              <Clock className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Real-Time Updates</h3>
            <p className="text-muted-foreground">Instant notifications and updates on projects, budgets, and activities</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;