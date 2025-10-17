import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AmountInput } from '@/components/forms/AmountInput';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, TrendingDown, Plus, Minus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';

const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(999999999.99, 'Amount too large'),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional(),
});

interface BarangayBudget {
  id: string;
  barangay_id: string;
  total_budget: number;
  available_budget: number;
  barangay_name: string;
}

export const AllBarangaysBudgetManagement = () => {
  const [barangayBudgets, setBarangayBudgets] = useState<BarangayBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayBudget | null>(null);
  const [dialogType, setDialogType] = useState<'add' | 'deduct' | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllBarangayBudgets();
  }, []);

  const fetchAllBarangayBudgets = async () => {
    setIsLoading(true);
    try {
      // First get all barangays
      const { data: barangays, error: barangaysError } = await supabase
        .from('barangays')
        .select('id, name')
        .order('name');

      if (barangaysError) throw barangaysError;

      // Get all budgets
      const { data: budgets, error: budgetsError } = await supabase
        .from('barangay_budgets')
        .select('*');

      if (budgetsError) throw budgetsError;

      // Create a map of existing budgets
      const budgetMap = new Map(budgets?.map(b => [b.barangay_id, b]) || []);

      // Combine barangays with their budgets, initializing if needed
      const combined: BarangayBudget[] = await Promise.all(
        (barangays || []).map(async (barangay) => {
          let budget = budgetMap.get(barangay.id);
          
          // If budget doesn't exist, create it
          if (!budget) {
            const { data: newBudget, error: insertError } = await supabase
              .from('barangay_budgets')
              .insert({
                barangay_id: barangay.id,
                total_budget: 0,
                available_budget: 0,
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error initializing budget:', insertError);
              budget = {
                id: '',
                barangay_id: barangay.id,
                total_budget: 0,
                available_budget: 0,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
              };
            } else {
              budget = newBudget;
            }
          }

          return {
            id: budget.id,
            barangay_id: barangay.id,
            total_budget: budget.total_budget,
            available_budget: budget.available_budget,
            barangay_name: barangay.name,
          };
        })
      );

      setBarangayBudgets(combined);
    } catch (error) {
      console.error('Error fetching barangay budgets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load barangay budgets',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDialog = (barangay: BarangayBudget, type: 'add' | 'deduct') => {
    setSelectedBarangay(barangay);
    setDialogType(type);
    setAmount('');
    setDescription('');
    setErrors({});
  };

  const closeDialog = () => {
    setSelectedBarangay(null);
    setDialogType(null);
    setAmount('');
    setDescription('');
    setErrors({});
  };

  const handleTransaction = async () => {
    if (!selectedBarangay || !dialogType) return;

    setErrors({});
    
    const validation = transactionSchema.safeParse({
      amount: parseFloat(amount),
      description: description || undefined,
    });

    if (!validation.success) {
      const fieldErrors: { amount?: string; description?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'amount') {
          fieldErrors.amount = err.message;
        } else if (err.path[0] === 'description') {
          fieldErrors.description = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (dialogType === 'deduct' && parseFloat(amount) > selectedBarangay.available_budget) {
      setErrors({ amount: 'Insufficient funds' });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: newTransaction, error } = await supabase
        .from('budget_transactions')
        .insert({
          barangay_id: selectedBarangay.barangay_id,
          amount: validation.data.amount,
          transaction_type: dialogType,
          description: validation.data.description || null,
          created_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the audit
      await logAudit({
        action: `budget_${dialogType}`,
        tableName: 'budget_transactions',
        recordId: newTransaction.id,
        barangayId: selectedBarangay.barangay_id,
        details: {
          barangay: selectedBarangay.barangay_name,
          amount: validation.data.amount,
          description: validation.data.description,
        },
      });

      toast({
        title: 'Success',
        description: `Budget ${dialogType === 'add' ? 'added' : 'deducted'} successfully for ${selectedBarangay.barangay_name}`,
      });

      closeDialog();
      fetchAllBarangayBudgets();
    } catch (error: any) {
      console.error('Error processing transaction:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process transaction',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalOverallBudget = barangayBudgets.reduce((sum, b) => sum + b.total_budget, 0);
  const totalAvailableBudget = barangayBudgets.reduce((sum, b) => sum + b.available_budget, 0);
  const totalUtilized = totalOverallBudget - totalAvailableBudget;

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overall Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ₱{totalOverallBudget.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">All barangays combined</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Available</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              ₱{totalAvailableBudget.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Total remaining funds</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilized</CardTitle>
            <TrendingDown className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              ₱{totalUtilized.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalOverallBudget > 0 ? `${(totalUtilized / totalOverallBudget * 100).toFixed(1)}% utilized` : '0% utilized'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Barangay Budgets */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Barangay Budgets</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {barangayBudgets.map((barangay) => (
            <Card key={barangay.barangay_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">{barangay.barangay_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Budget:</span>
                    <span className="font-semibold">
                      ₱{barangay.total_budget.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-semibold text-secondary">
                      ₱{barangay.available_budget.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utilized:</span>
                    <span className="font-semibold text-accent">
                      ₱{(barangay.total_budget - barangay.available_budget).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openDialog(barangay, 'add')}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => openDialog(barangay, 'deduct')}
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Deduct
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction Dialog */}
      <Dialog open={!!dialogType} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'add' ? 'Add' : 'Deduct'} Budget - {selectedBarangay?.barangay_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱) *</Label>
              <AmountInput
                id="amount"
                value={amount}
                onChange={setAmount}
                disabled={isSubmitting}
                placeholder="0.00"
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter transaction details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTransaction}
                disabled={isSubmitting}
                className={dialogType === 'deduct' ? "bg-destructive hover:bg-destructive/90" : ""}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dialogType === 'add' ? 'Add' : 'Deduct'} Funds
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
