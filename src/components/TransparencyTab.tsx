import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, DollarSign, FileText, ClipboardList, Settings, Calendar, TrendingUp, RotateCcw } from 'lucide-react';
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
import { BudgetLineChart } from '@/components/BudgetLineChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

  const handleResetBudget = async (barangayId: string, barangayName: string) => {
    try {
      const { error } = await supabase
        .from('barangay_budgets')
        .update({
          total_budget: 0,
          available_budget: 0,
        })
        .eq('barangay_id', barangayId);

      if (error) throw error;

      toast({
        title: 'Budget Reset',
        description: `Successfully reset budget for ${barangayName}`,
      });

      fetchBudgets();
    } catch (error) {
      console.error('Error resetting budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset budget',
        variant: 'destructive',
      });
    }
  };

  const handleResetAllBudgets = async () => {
    try {
      const { error } = await supabase
        .from('barangay_budgets')
        .update({
          total_budget: 0,
          available_budget: 0,
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      if (error) throw error;

      toast({
        title: 'All Budgets Reset',
        description: 'Successfully reset all barangay budgets',
      });

      fetchBudgets();
    } catch (error) {
      console.error('Error resetting all budgets:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset all budgets',
        variant: 'destructive',
      });
    }
  };

  return (
    <Tabs defaultValue="transparency" className="space-y-8">
      <TabsList>
        <TabsTrigger value="transparency">Transparency Dashboard</TabsTrigger>
        {isMainAdmin && (
          <TabsTrigger value="budget-reset">Budget Reset</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="transparency" className="space-y-8">
      {isMainAdmin && (
        <div className="flex justify-end">
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
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

      {/* Budget Utilization Chart - FIRST */}
      {config.show_budget_utilization && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Budget Utilization Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {budgets.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={budgets.map(b => ({
                      name: b.barangays?.name || 'Unknown',
                      utilized: b.total_budget - b.available_budget,
                      available: b.available_budget,
                    }))}
                    margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [
                        `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
                      ]}
                    />
                    <Legend iconType="circle" />
                    <Bar 
                      dataKey="utilized" 
                      fill="#7c3aed" 
                      name="Utilized"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar 
                      dataKey="available" 
                      fill="#e299cc" 
                      name="Available"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {config.show_active_leaders && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Active Leaders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeLeadersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Serving the community</p>
            </CardContent>
          </Card>
        )}

        {config.show_budget_status && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ₱{overallBudget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all barangays</p>
            </CardContent>
          </Card>
        )}

        {config.show_documents && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{documentStats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Public records</p>
            </CardContent>
          </Card>
        )}

        {config.show_events && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{eventStats.upcoming}</div>
              <p className="text-xs text-muted-foreground mt-1">Scheduled activities</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Status Section - Simplified */}
      {config.show_budget_status && budgets.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Budget Overview by Barangay
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {budgets.slice(0, 5).map((budget) => {
                const utilization = ((budget.total_budget - budget.available_budget) / budget.total_budget) * 100;
                return (
                  <div key={budget.id} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{budget.barangays?.name || 'Unknown'}</span>
                      <span className="text-sm font-bold text-primary">
                        ₱{budget.total_budget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Available: ₱{budget.available_budget.toLocaleString('en-PH')}</span>
                      <span>{utilization.toFixed(1)}% utilized</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${utilization}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Survey Section - Simplified */}
      {config.show_monthly_survey && surveyData.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Survey Participation This Month
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {surveyData.map((data) => (
                <div key={data.barangay_id} className="p-3 rounded-lg border text-center hover:border-primary/50 transition-colors">
                  <div className="text-2xl font-bold text-primary">{data.survey_count}</div>
                  <p className="text-xs text-muted-foreground mt-1">{data.barangay_name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </TabsContent>

      {isMainAdmin && (
        <TabsContent value="budget-reset" className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                Budget Reset Management
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">Reset All Barangay Budgets</h3>
                    <p className="text-sm text-muted-foreground">This will reset total and utilized budgets for all barangays to ₱0.00</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will reset all barangay budgets to ₱0.00. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAllBudgets}>
                          Reset All Budgets
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Reset Individual Barangay</h3>
                  {budgets.map((budget) => (
                    <div key={budget.id} className="flex justify-between items-center p-4 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium">{budget.barangays?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          Total: ₱{budget.total_budget.toLocaleString('en-PH', { minimumFractionDigits: 2 })} | 
                          Available: ₱{budget.available_budget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reset {budget.barangays?.name} Budget?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will reset the budget for {budget.barangays?.name} to ₱0.00. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleResetBudget(budget.barangay_id, budget.barangays?.name || 'Unknown')}
                            >
                              Reset Budget
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
};