import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2, Upload } from 'lucide-react';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';

const skChairmanSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  full_name: z.string().trim().min(1, 'Full name is required').max(100, 'Name must be less than 100 characters'),
  barangay_id: z.string().uuid('Please select a barangay'),
  age: z.number().int().min(15, 'Age must be at least 15').max(30, 'Age must be at most 30').optional(),
  term_start_date: z.string().optional(),
  facebook_url: z.string().url('Invalid Facebook URL').max(500, 'URL too long').optional().or(z.literal('')),
  contact_number: z.string().trim().max(20, 'Contact number too long').optional(),
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [formData, setFormData] = useState<Partial<SKChairmanFormData & { age_string?: string }>>({
    email: '',
    password: '',
    full_name: '',
    barangay_id: '',
    age_string: '',
    term_start_date: '',
    facebook_url: '',
    contact_number: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SKChairmanFormData | 'avatar', string>>>({});
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
      setFormData({ 
        email: '', 
        password: '', 
        full_name: '', 
        barangay_id: '',
        age_string: '',
        term_start_date: '',
        facebook_url: '',
        contact_number: '',
      });
      setAvatarFile(null);
      setAvatarPreview('');
      setErrors({});
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

    const validation = skChairmanSchema.safeParse(parsedData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof SKChairmanFormData | 'avatar', string>> = {};
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
      let avatarUrl = '';

      // Upload avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-thumbnails')
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('event-thumbnails')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }
      // Create auth user via edge function (won't auto-login)
      const { data: { session } } = await supabase.auth.getSession();
      const { data: createUserResponse, error: authError } = await supabase.functions.invoke('create-user', {
        body: {
          email: validation.data.email,
          password: validation.data.password,
          metadata: {
            full_name: validation.data.full_name,
          },
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (authError) {
        throw authError;
      }

      if (!createUserResponse?.user) {
        throw new Error('Failed to create user');
      }

      const authData = { user: createUserResponse.user };

      // Update profile (trigger already created it)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'sk_chairman',
          barangay_id: validation.data.barangay_id,
          avatar_url: avatarUrl || undefined,
          age: validation.data.age || undefined,
          term_start_date: validation.data.term_start_date || undefined,
          facebook_url: validation.data.facebook_url || undefined,
          contact_number: validation.data.contact_number || undefined,
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

      // Log the audit
      await logAudit({
        action: "user_create",
        tableName: "profiles",
        recordId: authData.user.id,
        barangayId: validation.data.barangay_id,
        details: {
          full_name: validation.data.full_name,
          role: 'sk_chairman',
          email: validation.data.email,
        },
      });

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
