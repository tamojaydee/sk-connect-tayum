import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, DollarSign, FileText, ClipboardList, Settings, Calendar, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BudgetData {
  id: string;
  barangay_id: string;
  total_budget: number;
  available_budget: number;
  barangays: {
    name: string;
    code: string;
  } | null;
}

interface DocumentStats {
  total: number;
  submitted: number;
  underReview: number;
  approved: number;
}

interface SurveyData {
  barangay_id: string;
  survey_count: number;
  barangay_name: string;
}

interface EventStats {
  total: number;
  upcoming: number;
  completed: number;
  thisMonth: number;
}

interface TransparencyConfig {
  show_active_leaders: boolean;
  show_budget_status: boolean;
  show_documents: boolean;
  show_monthly_survey: boolean;
  show_events: boolean;
  show_budget_utilization: boolean;
}

interface TransparencyTabProps {
  isMainAdmin: boolean;
}

export const TransparencyTab = ({ isMainAdmin }: TransparencyTabProps) => {
  const [activeLeadersCount, setActiveLeadersCount] = useState(0);
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [overallBudget, setOverallBudget] = useState(0);
  const [documentStats, setDocumentStats] = useState<DocumentStats>({
    total: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
  });
  const [surveyData, setSurveyData] = useState<SurveyData[]>([]);
  const [eventStats, setEventStats] = useState<EventStats>({
    total: 0,
    upcoming: 0,
    completed: 0,
    thisMonth: 0,
  });
  const [config, setConfig] = useState<TransparencyConfig>({
    show_active_leaders: true,
    show_budget_status: true,
    show_documents: true,
    show_monthly_survey: true,
    show_events: true,
    show_budget_utilization: true,
  });
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveLeaders();
    fetchBudgets();
    fetchDocumentStats();
    fetchMonthlySurveys();
    fetchEventStats();
    loadConfig();
  }, []);

  const loadConfig = () => {
    const savedConfig = localStorage.getItem('transparency_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  };

  const saveConfig = () => {
    localStorage.setItem('transparency_config', JSON.stringify(config));
    toast({
      title: 'Configuration Saved',
      description: 'Transparency tab settings have been updated',
    });
    setShowConfigDialog(false);
  };

  const fetchActiveLeaders = async () => {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching active leaders:', error);
    } else {
      setActiveLeadersCount(count || 0);
    }
  };

  const fetchBudgets = async () => {
    const { data, error } = await supabase
      .from('barangay_budgets')
      .select(`
        *,
        barangays (name, code)
      `)
      .order('total_budget', { ascending: false });

    if (error) {
      console.error('Error fetching budgets:', error);
    } else {
      const budgetData = data as BudgetData[];
      setBudgets(budgetData);
      const total = budgetData.reduce((sum, b) => sum + b.total_budget, 0);
      setOverallBudget(total);
    }
  };

  const fetchDocumentStats = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('document_type');

    if (error) {
      console.error('Error fetching documents:', error);
    } else {
      const stats = {
        total: data?.length || 0,
        submitted: data?.filter(d => d.document_type === 'submitted').length || 0,
        underReview: data?.filter(d => d.document_type === 'under_review').length || 0,
        approved: data?.filter(d => d.document_type === 'approved').length || 0,
      };
      setDocumentStats(stats);
    }
  };

  const fetchMonthlySurveys = async () => {
    const { data: surveys, error: surveyError } = await supabase
      .from('surveys')
      .select('barangay_id')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .lte('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString());

    if (surveyError) {
      console.error('Error fetching surveys:', surveyError);
      return;
    }

    const { data: barangays, error: barangayError } = await supabase
      .from('barangays')
      .select('id, name');

    if (barangayError) {
      console.error('Error fetching barangays:', barangayError);
      return;
    }

    const surveyCountByBarangay = surveys?.reduce((acc, survey) => {
      acc[survey.barangay_id] = (acc[survey.barangay_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const surveyDataWithNames = Object.entries(surveyCountByBarangay).map(([barangay_id, count]) => {
      const barangay = barangays?.find(b => b.id === barangay_id);
      return {
        barangay_id,
        survey_count: count,
        barangay_name: barangay?.name || 'Unknown',
      };
    });

    setSurveyData(surveyDataWithNames);
  };

  const fetchEventStats = async () => {
    const { data: events, error } = await supabase
      .from('events')
      .select('event_date, status');

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const stats = {
      total: events?.length || 0,
      upcoming: events?.filter(e => new Date(e.event_date) > now && e.status === 'active').length || 0,
      completed: events?.filter(e => new Date(e.event_date) < now || e.status === 'completed').length || 0,
      thisMonth: events?.filter(e => {
        const eventDate = new Date(e.event_date);
        return eventDate >= startOfMonth && eventDate <= endOfMonth;
      }).length || 0,
    };
    
    setEventStats(stats);
  };

  const COLORS = ['#7c3aed', '#e299cc', '#a78bfa', '#f0abfc', '#c084fc'];

  return (
    <div className="space-y-6">
      {isMainAdmin && (
        <div className="flex justify-end mb-4">
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure Display
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transparency Tab Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_leaders">Active Leaders Section</Label>
                    <p className="text-sm text-muted-foreground">Display count of active users</p>
                  </div>
                  <Switch
                    id="show_leaders"
                    checked={config.show_active_leaders}
                    onCheckedChange={(checked) => setConfig({ ...config, show_active_leaders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_budget">Budget Status Section</Label>
                    <p className="text-sm text-muted-foreground">Display budget information</p>
                  </div>
                  <Switch
                    id="show_budget"
                    checked={config.show_budget_status}
                    onCheckedChange={(checked) => setConfig({ ...config, show_budget_status: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_docs">Documents Section</Label>
                    <p className="text-sm text-muted-foreground">Display document statistics</p>
                  </div>
                  <Switch
                    id="show_docs"
                    checked={config.show_documents}
                    onCheckedChange={(checked) => setConfig({ ...config, show_documents: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_survey">Monthly Survey Section</Label>
                    <p className="text-sm text-muted-foreground">Display survey participation</p>
                  </div>
                  <Switch
                    id="show_survey"
                    checked={config.show_monthly_survey}
                    onCheckedChange={(checked) => setConfig({ ...config, show_monthly_survey: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_events">Events Section</Label>
                    <p className="text-sm text-muted-foreground">Display event statistics</p>
                  </div>
                  <Switch
                    id="show_events"
                    checked={config.show_events}
                    onCheckedChange={(checked) => setConfig({ ...config, show_events: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show_utilization">Budget Utilization Section</Label>
                    <p className="text-sm text-muted-foreground">Display budget utilization rates</p>
                  </div>
                  <Switch
                    id="show_utilization"
                    checked={config.show_budget_utilization}
                    onCheckedChange={(checked) => setConfig({ ...config, show_budget_utilization: checked })}
                  />
                </div>

                <Button onClick={saveConfig} className="w-full">
                  Save Configuration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Active Leaders Section */}
      {config.show_active_leaders && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Active Leaders</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{activeLeadersCount}</div>
            <p className="text-sm text-muted-foreground mt-1">Currently serving the community</p>
          </CardContent>
        </Card>
      )}

      {/* Budget Status Section with Pie Chart */}
      {config.show_budget_status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Budget Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Budget</span>
                <span className="text-2xl font-bold text-primary">
                  ₱{overallBudget.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {budgets.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={budgets.map(b => ({
                        name: b.barangays?.name || 'Unknown',
                        value: b.total_budget,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {budgets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No budget data available
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Budget Utilization Section */}
      {config.show_budget_utilization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budgets.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgets.map(b => ({
                    name: b.barangays?.name || 'Unknown',
                    utilized: b.total_budget - b.available_budget,
                    available: b.available_budget,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                    <Legend />
                    <Bar dataKey="utilized" fill="#7c3aed" name="Utilized Budget" />
                    <Bar dataKey="available" fill="#e299cc" name="Available Budget" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No budget utilization data available
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documents Section */}
      {config.show_documents && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{documentStats.total}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold text-secondary">{documentStats.submitted}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Under Review</p>
                <p className="text-2xl font-bold text-amber-500">{documentStats.underReview}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-primary">{documentStats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events Section */}
      {config.show_events && (
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary" />
              Event Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold text-primary">{eventStats.total}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-3xl font-bold text-secondary">{eventStats.upcoming}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-primary">{eventStats.completed}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-3xl font-bold text-secondary">{eventStats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Survey Section */}
      {config.show_monthly_survey && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Monthly Survey Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {surveyData.length > 0 ? (
              surveyData.map((data) => (
                <div key={data.barangay_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <span className="font-medium">{data.barangay_name}</span>
                  <span className="text-2xl font-bold text-primary">{data.survey_count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No survey data for this month
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};