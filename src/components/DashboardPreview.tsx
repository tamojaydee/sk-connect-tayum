import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  Calendar,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

const DashboardPreview = () => {
  return (
    <section id="dashboard" className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-heading font-bold text-foreground mb-4">
            Dashboard Overview
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time insights into youth leadership activities, budget utilization, and community engagement across Tayum, Abra.
          </p>
        </div>
        
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Left Column - Key Metrics */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Active Leaders Card */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">Active Leaders</CardTitle>
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-2">147</div>
                <p className="text-sm text-muted-foreground mb-3">Registered SK officials</p>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                  <span className="text-sm text-secondary font-medium">+12% this month</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Budget Utilization */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">Budget Status</CardTitle>
                  <DollarSign className="h-5 w-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground mb-2">₱2.4M</div>
                <p className="text-sm text-muted-foreground mb-3">Total allocated budget</p>
                <Progress value={67} className="mb-2" />
                <p className="text-sm text-muted-foreground">67% utilized</p>
              </CardContent>
            </Card>
            
            {/* Pending Documents */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-heading">Documents</CardTitle>
                  <FileText className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Submitted</span>
                    <Badge variant="outline" className="bg-secondary/10 text-secondary">45</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Under Review</span>
                    <Badge variant="outline" className="bg-primary/10 text-primary">12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Approved</span>
                    <Badge variant="outline" className="bg-accent/10 text-accent">38</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Activity Feed & Projects */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recent Activities */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading">Recent Activities</CardTitle>
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Youth Sports Festival Budget Approved</p>
                      <p className="text-xs text-muted-foreground">Brgy. San Julian - ₱45,000 allocated</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Environmental Cleanup Project Updated</p>
                      <p className="text-xs text-muted-foreground">Brgy. Poblacion - Progress report submitted</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                    <Users className="h-5 w-5 text-accent mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">New SK Chairman Registered</p>
                      <p className="text-xs text-muted-foreground">Brgy. Bucloc - Juan Carlos M. Santos</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  View All Activities
                </Button>
              </CardContent>
            </Card>
            
            {/* Active Projects */}
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading">Active Projects</CardTitle>
                  <Calendar className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">Peace Building Workshop</h4>
                      <Badge className="bg-secondary/10 text-secondary text-xs">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Brgy. Bangbangcag</p>
                    <Progress value={75} className="mb-2" />
                    <p className="text-xs text-muted-foreground">75% complete</p>
                  </div>
                  
                  <div className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">Youth Skills Training</h4>
                      <Badge className="bg-primary/10 text-primary text-xs">Planning</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">Multiple Barangays</p>
                    <Progress value={25} className="mb-2" />
                    <p className="text-xs text-muted-foreground">25% complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-8">
          <h3 className="text-2xl font-heading font-bold text-foreground mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join the growing community of youth leaders using SKey Connect to drive transparent governance in Tayum, Abra.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary-hover">
            Access Dashboard
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;