import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Calendar, Users, TrendingUp } from 'lucide-react';
import { SurveyAnalytics } from './SurveyAnalytics';

interface MonthlyData {
  month: string;
  year: number;
  displayName: string;
  totalSurveys: number;
  maleCount: number;
  femaleCount: number;
}

interface SurveyMonthlyHistoryProps {
  barangayId?: string;
}

export const SurveyMonthlyHistory = ({ barangayId }: SurveyMonthlyHistoryProps) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMonthlyData();
  }, [barangayId]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('surveys')
        .select('created_at, gender, barangay_id');

      if (barangayId) {
        query = query.eq('barangay_id', barangayId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Group surveys by month/year
      const monthGroups = new Map<string, { total: number; male: number; female: number; year: number; month: string }>();

      data?.forEach((survey) => {
        const date = new Date(survey.created_at);
        const monthKey = format(date, 'yyyy-MM');
        const monthName = format(date, 'MMMM yyyy');
        const year = date.getFullYear();
        const month = format(date, 'MMMM');

        if (!monthGroups.has(monthKey)) {
          monthGroups.set(monthKey, { total: 0, male: 0, female: 0, year, month });
        }

        const group = monthGroups.get(monthKey)!;
        group.total++;
        if (survey.gender === 'male') group.male++;
        if (survey.gender === 'female') group.female++;
      });

      // Convert to array and sort by date (newest first)
      const monthlyArray: MonthlyData[] = Array.from(monthGroups.entries())
        .map(([key, data]) => ({
          month: key,
          year: data.year,
          displayName: data.month + ' ' + data.year,
          totalSurveys: data.total,
          maleCount: data.male,
          femaleCount: data.female,
        }))
        .sort((a, b) => b.month.localeCompare(a.month));

      setMonthlyData(monthlyArray);
      
      // Auto-select first month if available
      if (monthlyArray.length > 0 && !selectedMonth) {
        setSelectedMonth(monthlyArray[0].month);
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Loading monthly history...</div>
        </div>
      </div>
    );
  }

  if (monthlyData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No survey data available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedMonth || monthlyData[0]?.month} onValueChange={setSelectedMonth}>
        <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
          {monthlyData.map((data) => (
            <TabsTrigger
              key={data.month}
              value={data.month}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {data.displayName}
            </TabsTrigger>
          ))}
        </TabsList>

        {monthlyData.map((data) => (
          <TabsContent key={data.month} value={data.month} className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.totalSurveys}</div>
                  <p className="text-xs text-muted-foreground">
                    Responses in {data.displayName}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Male Respondents</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.maleCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.totalSurveys > 0 ? Math.round((data.maleCount / data.totalSurveys) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Female Respondents</CardTitle>
                  <TrendingUp className="h-4 w-4 text-pink-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.femaleCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {data.totalSurveys > 0 ? Math.round((data.femaleCount / data.totalSurveys) * 100) : 0}% of total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics for Selected Month */}
            <SurveyAnalytics 
              barangayId={barangayId} 
              monthFilter={data.month}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
