import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Upload, X } from 'lucide-react';
import { logAudit } from '@/lib/auditLog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const kagawadSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(1, 'Full name is required').max(100, 'Name must be less than 100 characters'),
  contact_number: z.string().max(20, 'Contact number must be less than 20 characters').optional(),
  age: z.string().optional(),
  facebook_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type KagawadFormData = z.infer<typeof kagawadSchema>;

interface AddKagawadFormProps {
  barangayId: string;
  barangayName: string;
  onSuccess: () => void;
}

export const AddKagawadForm: React.FC<AddKagawadFormProps> = ({ 
  barangayId, 
  barangayName,
  onSuccess 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const form = useForm<KagawadFormData>({
    resolver: zodResolver(kagawadSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      contact_number: '',
      age: '',
      facebook_url: '',
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    setUploading(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload profile picture',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: KagawadFormData) => {
    setIsSubmitting(true);
    try {
      // Create the auth user with provided password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: data.full_name,
            role: 'kagawad',
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Upload avatar if provided
      let avatarUrl: string | null = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(authData.user.id);
      }

      // Update the profile with additional info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          barangay_id: barangayId,
          contact_number: data.contact_number || null,
          age: data.age ? parseInt(data.age) : null,
          facebook_url: data.facebook_url || null,
          avatar_url: avatarUrl,
          term_start_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Log the audit
      await logAudit({
        action: 'create',
        tableName: 'profiles',
        recordId: authData.user.id,
        barangayId: barangayId,
        details: {
          email: data.email,
          full_name: data.full_name,
          role: 'kagawad',
          barangay: barangayName,
        },
      });

      toast({
        title: 'Success',
        description: `Kagawad ${data.full_name} has been added successfully.`,
      });

      form.reset();
      removeAvatar();
      setIsOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding kagawad:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add kagawad',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Kagawad
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Kagawad</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <FormLabel>Profile Picture</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview} alt="Preview" />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Upload className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {!avatarFile ? (
                    <div>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isSubmitting || uploading}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('avatar')?.click()}
                        disabled={isSubmitting || uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Image
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={removeAvatar}
                      disabled={isSubmitting || uploading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Image
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 5MB (JPG, PNG, GIF)
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Juan Dela Cruz" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="juan@example.com" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="Enter password" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+63 912 345 6789" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="18" max="30" placeholder="25" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="facebook_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Profile URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://facebook.com/username" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Kagawad
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
