import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BudgetTransaction {
  created_at: string;
  amount: number;
  transaction_type: string;
  barangays: {
    name: string;
  };
}

export const BudgetLineChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetTransactions();
  }, []);

  const fetchBudgetTransactions = async () => {
    try {
      // Get transactions from the current year
      const currentYear = new Date().getFullYear();
      const startDate = new Date(currentYear, 0, 1).toISOString();
      
      const { data, error } = await supabase
        .from('budget_transactions')
        .select(`
          created_at,
          amount,
          transaction_type,
          barangays (name)
        `)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyData: Record<string, Record<string, number>> = {};
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      // Initialize all months
      months.forEach(month => {
        monthlyData[month] = {};
      });

      // Process transactions
      data?.forEach((transaction: any) => {
        const date = new Date(transaction.created_at);
        const month = months[date.getMonth()];
        const barangayName = transaction.barangays?.name || 'Unknown';
        
        if (!monthlyData[month][barangayName]) {
          monthlyData[month][barangayName] = 0;
        }

        if (transaction.transaction_type === 'deduct') {
          monthlyData[month][barangayName] += transaction.amount;
        }
      });

      // Convert to chart format
      const formattedData = months.map(month => {
        const monthData: any = { month };
        Object.keys(monthlyData[month]).forEach(barangay => {
          monthData[barangay] = monthlyData[month][barangay];
        });
        return monthData;
      });

      setChartData(formattedData);
    } catch (error) {
      console.error('Error fetching budget transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#7c3aed', '#e299cc', '#a78bfa', '#f0abfc', '#c084fc', '#d946ef', '#a855f7'];

  // Get unique barangays for legend
  const barangays = Array.from(
    new Set(
      chartData.flatMap(month => 
        Object.keys(month).filter(key => key !== 'month')
      )
    )
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-secondary/10 to-accent/10 border-b">
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="h-6 w-6 text-secondary" />
          Monthly Budget Distribution ({new Date().getFullYear()})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  stroke="hsl(var(--border))"
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  stroke="hsl(var(--border))"
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                  formatter={(value: number) => [
                    `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    'Spent'
                  ]}
                />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '20px',
                  }}
                />
                {barangays.map((barangay, index) => (
                  <Line
                    key={barangay}
                    type="monotone"
                    dataKey={barangay}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ fill: COLORS[index % COLORS.length], r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center">
            <p className="text-muted-foreground">No budget distribution data available for this year</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
