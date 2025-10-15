import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AmountInput } from '@/components/forms/AmountInput';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, TrendingDown, Plus, Minus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';

const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(99999999999.99, 'Amount too large'),
  description: z.string().trim().max(500, 'Description must be less than 500 characters').optional(),
});

interface BudgetData {
  id: string;
  barangay_id: string;
  total_budget: number;
  available_budget: number;
  updated_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: 'add' | 'deduct';
  description: string | null;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export const BudgetManagement = ({ barangayId, barangayName }: { barangayId: string; barangayName?: string }) => {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeductDialog, setShowDeductDialog] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ amount?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBudget();
    fetchTransactions();
  }, [barangayId]);

  const fetchBudget = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('barangay_budgets')
      .select('*')
      .eq('barangay_id', barangayId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching budget:', error);
      toast({
        title: 'Error',
        description: 'Failed to load budget data',
        variant: 'destructive',
      });
    } else if (!data) {
      // Initialize budget if it doesn't exist
      const { data: newBudget, error: insertError } = await supabase
        .from('barangay_budgets')
        .insert({
          barangay_id: barangayId,
          total_budget: 0,
          available_budget: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error initializing budget:', insertError);
      } else {
        setBudget(newBudget);
      }
    } else {
      setBudget(data);
    }
    setIsLoading(false);
  };

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('budget_transactions')
      .select(`
        *,
        profiles (full_name)
      `)
      .eq('barangay_id', barangayId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions((data || []) as Transaction[]);
    }
  };

  const handleTransaction = async (type: 'add' | 'deduct') => {
    setErrors({});
    
    if (!amount || amount.trim() === '') {
      setErrors({ amount: 'Amount is required' });
      return;
    }
    
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

    if (type === 'deduct' && budget && parseFloat(amount) > budget.available_budget) {
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
          barangay_id: barangayId,
          amount: validation.data.amount,
          transaction_type: type,
          description: validation.data.description || null,
          created_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the audit
      await logAudit({
        action: `budget_${type}`,
        tableName: 'budget_transactions',
        recordId: newTransaction.id,
        barangayId: barangayId,
        details: {
          amount: validation.data.amount,
          transaction_type: type,
          description: validation.data.description,
        },
      });

      toast({
        title: 'Success',
        description: `Budget ${type === 'add' ? 'added' : 'deducted'} successfully`,
      });

      setAmount('');
      setDescription('');
      setShowAddDialog(false);
      setShowDeductDialog(false);
      fetchBudget();
      fetchTransactions();
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

  const TransactionDialog = ({ type }: { type: 'add' | 'deduct' }) => {
    const isAdd = type === 'add';
    const open = isAdd ? showAddDialog : showDeductDialog;
    const setOpen = isAdd ? setShowAddDialog : setShowDeductDialog;

    return (
      <Dialog open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setAmount('');
          setDescription('');
          setErrors({});
        }
      }}>
        <DialogTrigger asChild>
          <Button variant={isAdd ? "default" : "outline"} className={isAdd ? "" : "border-destructive text-destructive hover:bg-destructive/10"}>
            {isAdd ? <Plus className="h-4 w-4 mr-2" /> : <Minus className="h-4 w-4 mr-2" />}
            {isAdd ? 'Add Funds' : 'Deduct Funds'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAdd ? 'Add' : 'Deduct'} Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₱) *</Label>
              <AmountInput
                id="amount"
                value={amount}
                onChange={setAmount}
                disabled={isSubmitting}
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
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleTransaction(type)}
                disabled={isSubmitting}
                className={!isAdd ? "bg-destructive hover:bg-destructive/90" : ""}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isAdd ? 'Add' : 'Deduct'} Funds
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ₱{budget?.total_budget.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">{barangayName || 'Barangay'} total allocation</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              ₱{budget?.available_budget.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Remaining funds</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilized</CardTitle>
            <TrendingDown className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              ₱{budget ? (budget.total_budget - budget.available_budget).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {budget && budget.total_budget > 0 ? 
                `${((budget.total_budget - budget.available_budget) / budget.total_budget * 100).toFixed(1)}% utilized` : 
                '0% utilized'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Budget Management</CardTitle>
            <div className="flex gap-2">
              <TransactionDialog type="add" />
              <TransactionDialog type="deduct" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.transaction_type === 'add' 
                          ? 'bg-secondary/10 text-secondary' 
                          : 'bg-destructive/10 text-destructive'
                      }`}>
                        {transaction.transaction_type === 'add' ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.transaction_type === 'add' ? 'Added' : 'Deducted'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.description || 'No description'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          By {transaction.profiles.full_name} • {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`font-bold ${
                      transaction.transaction_type === 'add' ? 'text-secondary' : 'text-destructive'
                    }`}>
                      {transaction.transaction_type === 'add' ? '+' : '-'}₱{transaction.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
