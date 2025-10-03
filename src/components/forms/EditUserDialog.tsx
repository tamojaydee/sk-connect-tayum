import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Switch } from '@/components/ui/switch';

const editUserSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  role: z.enum(['main_admin', 'sk_chairman', 'kagawad']),
  barangay_id: z.string().uuid('Please select a barangay').optional().nullable(),
  is_active: z.boolean(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface Barangay {
  id: string;
  name: string;
  code: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'main_admin' | 'sk_chairman' | 'kagawad';
  barangay_id?: string;
  is_active: boolean;
}

interface EditUserDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentUserRole: 'main_admin' | 'sk_chairman' | 'kagawad';
}

export const EditUserDialog = ({ user, open, onOpenChange, onSuccess, currentUserRole }: EditUserDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [formData, setFormData] = useState<EditUserFormData>({
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    barangay_id: user.barangay_id || null,
    is_active: user.is_active,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EditUserFormData, string>>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchBarangays();
      setFormData({
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        barangay_id: user.barangay_id || null,
        is_active: user.is_active,
      });
      setErrors({});
    }
  }, [open, user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = editUserSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof EditUserFormData, string>> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof EditUserFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: validation.data.full_name,
          email: validation.data.email,
          role: validation.data.role,
          barangay_id: validation.data.barangay_id,
          is_active: validation.data.is_active,
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
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
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          {currentUserRole === 'main_admin' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as EditUserFormData['role'] })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main_admin">Main Admin</SelectItem>
                    <SelectItem value="sk_chairman">SK Chairman</SelectItem>
                    <SelectItem value="kagawad">Kagawad</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="barangay">Barangay</Label>
                <Select
                  value={formData.barangay_id || ''}
                  onValueChange={(value) => setFormData({ ...formData, barangay_id: value || null })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a barangay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {barangays.map((barangay) => (
                      <SelectItem key={barangay.id} value={barangay.id}>
                        {barangay.name} ({barangay.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.barangay_id && <p className="text-sm text-destructive">{errors.barangay_id}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  disabled={isLoading}
                />
                <Label htmlFor="is_active">Active User</Label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
