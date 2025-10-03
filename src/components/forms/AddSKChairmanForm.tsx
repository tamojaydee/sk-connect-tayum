import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2 } from 'lucide-react';
import { z } from 'zod';

const skChairmanSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  full_name: z.string().trim().min(1, 'Full name is required').max(100, 'Name must be less than 100 characters'),
  barangay_id: z.string().uuid('Please select a barangay'),
});

type SKChairmanFormData = z.infer<typeof skChairmanSchema>;

interface Barangay {
  id: string;
  name: string;
  code: string;
}

export const AddSKChairmanForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [formData, setFormData] = useState<Partial<SKChairmanFormData>>({
    email: '',
    password: '',
    full_name: '',
    barangay_id: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SKChairmanFormData, string>>>({});
  const { toast } = useToast();

  const fetchBarangays = async () => {
    const { data, error } = await supabase
      .from('barangays')
      .select('*')
      .order('name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load barangays',
        variant: 'destructive',
      });
    } else {
      setBarangays(data || []);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchBarangays();
      setFormData({ email: '', password: '', full_name: '', barangay_id: '' });
      setErrors({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = skChairmanSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof SKChairmanFormData, string>> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof SKChairmanFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validation.data.email,
        password: validation.data.password,
        options: {
          data: {
            full_name: validation.data.full_name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Update profile (trigger already created it)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'sk_chairman',
          barangay_id: validation.data.barangay_id,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        throw profileError;
      }

      // Initialize budget for the barangay if it doesn't exist
      const { error: budgetError } = await supabase
        .from('barangay_budgets')
        .insert({
          barangay_id: validation.data.barangay_id,
          total_budget: 0,
          available_budget: 0,
        })
        .select()
        .single();

      // Ignore error if budget already exists (unique constraint)
      if (budgetError && !budgetError.message.includes('duplicate key')) {
        console.warn('Budget initialization warning:', budgetError);
      }

      toast({
        title: 'Success',
        description: 'SK Chairman created successfully',
      });

      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating SK Chairman:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create SK Chairman',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add SK Chairman
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New SK Chairman</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              placeholder="Juan Dela Cruz"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              disabled={isLoading}
            />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="chairman@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="barangay">Barangay *</Label>
            <Select
              value={formData.barangay_id}
              onValueChange={(value) => setFormData({ ...formData, barangay_id: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a barangay" />
              </SelectTrigger>
              <SelectContent>
                {barangays.map((barangay) => (
                  <SelectItem key={barangay.id} value={barangay.id}>
                    {barangay.name} ({barangay.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.barangay_id && <p className="text-sm text-destructive">{errors.barangay_id}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create SK Chairman
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
