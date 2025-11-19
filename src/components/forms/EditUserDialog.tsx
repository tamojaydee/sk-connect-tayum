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
import { logAudit } from '@/lib/auditLog';

const editUserSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  role: z.enum(['main_admin', 'sk_chairman', 'sk_secretary', 'kagawad']),
  barangay_id: z.string().uuid('Please select a barangay').optional().nullable(),
  is_active: z.boolean(),
  age: z.number().int().min(15, 'Age must be at least 15').max(30, 'Age must be at most 30').optional(),
  term_start_date: z.string().optional(),
  facebook_url: z.string().url('Invalid Facebook URL').max(500, 'URL too long').optional().or(z.literal('')),
  contact_number: z.string().trim().max(20, 'Contact number too long').optional(),
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
  role: 'main_admin' | 'sk_chairman' | 'sk_secretary' | 'kagawad';
  barangay_id?: string;
  is_active: boolean;
  age?: number | null;
  term_start_date?: string | null;
  facebook_url?: string | null;
  contact_number?: string | null;
  avatar_url?: string | null;
}

interface EditUserDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentUserRole: 'main_admin' | 'sk_chairman' | 'sk_secretary' | 'kagawad';
}

export const EditUserDialog = ({ user, open, onOpenChange, onSuccess, currentUserRole }: EditUserDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar_url || '');
  const [formData, setFormData] = useState<Partial<EditUserFormData> & { age_string?: string }>({
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    barangay_id: user.barangay_id || null,
    is_active: user.is_active,
    age_string: user.age?.toString() || '',
    term_start_date: user.term_start_date || '',
    facebook_url: user.facebook_url || '',
    contact_number: user.contact_number || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EditUserFormData | 'avatar', string>>>({});
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
        age_string: user.age?.toString() || '',
        term_start_date: user.term_start_date || '',
        facebook_url: user.facebook_url || '',
        contact_number: user.contact_number || '',
      });
      setAvatarFile(null);
      setAvatarPreview(user.avatar_url || '');
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, avatar: 'Image must be less than 5MB' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, avatar: 'File must be an image' });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setErrors({ ...errors, avatar: undefined });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Parse age from string
    const parsedData = {
      ...formData,
      age: formData.age_string ? parseInt(formData.age_string) : undefined,
    };
    delete parsedData.age_string;

    const validation = editUserSchema.safeParse(parsedData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof EditUserFormData | 'avatar', string>> = {};
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
      let avatarUrl = avatarPreview;

      // Upload avatar if a new file is provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: validation.data.full_name,
          email: validation.data.email,
          role: validation.data.role,
          barangay_id: validation.data.barangay_id,
          is_active: validation.data.is_active,
          avatar_url: avatarUrl || undefined,
          age: validation.data.age || undefined,
          term_start_date: validation.data.term_start_date || undefined,
          facebook_url: validation.data.facebook_url || undefined,
          contact_number: validation.data.contact_number || undefined,
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Log the audit
      await logAudit({
        action: "user_update",
        tableName: "profiles",
        recordId: user.id,
        barangayId: validation.data.barangay_id || undefined,
        details: {
          full_name: validation.data.full_name,
          role: validation.data.role,
          is_active: validation.data.is_active,
        },
      });

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                  onValueChange={(value) => setFormData({ ...formData, role: value as 'main_admin' | 'sk_chairman' | 'kagawad' })}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main_admin">Main Admin</SelectItem>
                    <SelectItem value="sk_chairman">SK Chairman</SelectItem>
                    <SelectItem value="sk_secretary">SK Secretary</SelectItem>
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

          <div className="space-y-2">
            <Label htmlFor="avatar">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={isLoading}
                className="cursor-pointer"
              />
              {avatarPreview && (
                <img src={avatarPreview} alt="Avatar preview" className="h-16 w-16 rounded-full object-cover border-2 border-border" />
              )}
            </div>
            {errors.avatar && <p className="text-sm text-destructive">{errors.avatar}</p>}
            <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="18"
                min="15"
                max="30"
                value={formData.age_string}
                onChange={(e) => setFormData({ ...formData, age_string: e.target.value })}
                disabled={isLoading}
              />
              {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="term_start_date">Term Start Date</Label>
              <Input
                id="term_start_date"
                type="date"
                value={formData.term_start_date}
                onChange={(e) => setFormData({ ...formData, term_start_date: e.target.value })}
                disabled={isLoading}
              />
              {errors.term_start_date && <p className="text-sm text-destructive">{errors.term_start_date}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_number">Contact Number</Label>
            <Input
              id="contact_number"
              type="tel"
              placeholder="+63 912 345 6789"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              disabled={isLoading}
            />
            {errors.contact_number && <p className="text-sm text-destructive">{errors.contact_number}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook_url">Facebook Profile URL</Label>
            <Input
              id="facebook_url"
              type="url"
              placeholder="https://facebook.com/username"
              value={formData.facebook_url}
              onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
              disabled={isLoading}
            />
            {errors.facebook_url && <p className="text-sm text-destructive">{errors.facebook_url}</p>}
          </div>

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
