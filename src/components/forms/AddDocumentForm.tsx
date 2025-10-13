import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload } from 'lucide-react';

const documentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().max(1000, "Description must be less than 1000 characters").optional(),
  document_type: z.string().min(1, "Document type is required"),
  is_public: z.boolean(),
  barangay_id: z.string().min(1, "Barangay is required"),
});


type DocumentFormData = z.infer<typeof documentSchema>;

interface Barangay {
  id: string;
  name: string;
  code: string;
}

interface AddDocumentFormProps {
  onDocumentAdded: () => void;
  userProfile: any;
}

export const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ onDocumentAdded, userProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<File | null>(null);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  
  const { toast } = useToast();
  
  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: '',
      description: '',
      document_type: '',
      is_public: false,
      barangay_id: userProfile?.barangay_id || '',
    },
  });

  useEffect(() => {
    fetchBarangays();
  }, []);

  const fetchBarangays = async () => {
    const { data, error } = await supabase
      .from('barangays')
      .select('id, name, code')
      .order('name');

    if (error) {
      console.error('Error fetching barangays:', error);
      toast({
        title: "Error",
        description: "Failed to load barangays",
        variant: "destructive",
      });
    } else {
      setBarangays(data || []);
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onSubmit = async (data: DocumentFormData) => {
    setIsLoading(true);
    
    try {
      let fileUrl = null;
      let thumbnailUrl = null;
      
      if (uploadedFile) {
        fileUrl = await handleFileUpload(uploadedFile);
      }

      if (uploadedThumbnail) {
        thumbnailUrl = await handleFileUpload(uploadedThumbnail);
      }

      const { error } = await supabase
        .from('documents')
        .insert({
          title: data.title,
          description: data.description,
          document_type: data.document_type,
          is_public: data.is_public,
          file_url: fileUrl,
          thumbnail_url: thumbnailUrl,
          barangay_id: data.barangay_id,
          created_by: userProfile.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document created successfully",
      });

      form.reset();
      setUploadedFile(null);
      setUploadedThumbnail(null);
      setIsOpen(false);
      onDocumentAdded();
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "Failed to create document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const documentTypes = [
    'ordinance',
    'resolution',
    'memorandum',
    'report',
    'certificate',
    'permit',
    'other'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Document title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="barangay_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barangay</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a barangay" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {barangays.map((barangay) => (
                        <SelectItem key={barangay.id} value={barangay.id}>
                          {barangay.name} ({barangay.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Document description" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="document_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Make this document public
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Public documents can be viewed by everyone
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Document File</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedFile(file);
                    }
                  }}
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {uploadedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadedFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Thumbnail Image (Optional)</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadedThumbnail(file);
                    }
                  }}
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {uploadedThumbnail && (
                <p className="text-sm text-muted-foreground">
                  Selected: {uploadedThumbnail.name}
                </p>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Document'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};