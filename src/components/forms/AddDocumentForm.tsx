import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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

interface DocumentFormData {
  title: string;
  description: string;
  document_type: string;
  is_public: boolean;
  file: FileList;
}

interface AddDocumentFormProps {
  onDocumentAdded: () => void;
  userProfile: any;
}

export const AddDocumentForm: React.FC<AddDocumentFormProps> = ({ onDocumentAdded, userProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  
  const form = useForm<DocumentFormData>({
    defaultValues: {
      title: '',
      description: '',
      document_type: '',
      is_public: false,
    },
  });

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
    if (!userProfile?.barangay_id) {
      toast({
        title: "Error",
        description: "No barangay assigned to your profile",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      let fileUrl = null;
      
      if (uploadedFile) {
        fileUrl = await handleFileUpload(uploadedFile);
      }

      const { error } = await supabase
        .from('documents')
        .insert({
          title: data.title,
          description: data.description,
          document_type: data.document_type,
          is_public: data.is_public,
          file_url: fileUrl,
          barangay_id: userProfile.barangay_id,
          created_by: userProfile.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document created successfully",
      });

      form.reset();
      setUploadedFile(null);
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
              rules={{ required: "Document type is required" }}
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
              <FormLabel>File Upload</FormLabel>
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