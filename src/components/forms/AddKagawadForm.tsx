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
import { Plus, Loader2 } from 'lucide-react';
import { logAudit } from '@/lib/auditLog';

const kagawadSchema = z.object({
  email: z.string().email('Invalid email address'),
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
  const { toast } = useToast();

  const form = useForm<KagawadFormData>({
    resolver: zodResolver(kagawadSchema),
    defaultValues: {
      email: '',
      full_name: '',
      contact_number: '',
      age: '',
      facebook_url: '',
    },
  });

  const onSubmit = async (data: KagawadFormData) => {
    setIsSubmitting(true);
    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';

      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: tempPassword,
        options: {
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

      // Update the profile with additional info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          barangay_id: barangayId,
          contact_number: data.contact_number || null,
          age: data.age ? parseInt(data.age) : null,
          facebook_url: data.facebook_url || null,
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
        description: `Kagawad ${data.full_name} has been added successfully. Temporary password: ${tempPassword}`,
      });

      form.reset();
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Kagawad</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
