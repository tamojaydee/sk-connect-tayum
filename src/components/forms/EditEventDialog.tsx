import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapboxLocationPicker } from './MapboxLocationPicker';
import { logAudit } from '@/lib/auditLog';

const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().max(1000, "Description must be less than 1000 characters").optional(),
  location: z.string().trim().min(1, "Location is required").max(255, "Location must be less than 255 characters"),
  event_date: z.string().min(1, "Event date is required"),
  barangay_id: z.string().min(1, "Barangay is required"),
  budget: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface Barangay {
  id: string;
  name: string;
  code: string;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  location: string;
  event_date: string;
  barangay_id: string;
  budget?: number;
  thumbnail_url?: string;
  status: string;
  created_by: string;
  barangays?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface EditEventDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated: () => void;
}

export const EditEventDialog: React.FC<EditEventDialogProps> = ({ 
  event, 
  open, 
  onOpenChange, 
  onEventUpdated 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      event_date: '',
      barangay_id: '',
      budget: '',
    },
  });

  useEffect(() => {
    fetchBarangays();
  }, []);

  useEffect(() => {
    if (event && open) {
      const parseLocation = (location: string) => {
        try {
          const parsed = JSON.parse(location);
          return {
            address: parsed.address,
            lat: parsed.coordinates?.lat,
            lng: parsed.coordinates?.lng,
          };
        } catch {
          return { address: location, lat: null, lng: null };
        }
      };

      const locationData = parseLocation(event.location);
      
      form.reset({
        title: event.title,
        description: event.description || '',
        location: locationData.address,
        event_date: new Date(event.event_date).toISOString().slice(0, 16),
        barangay_id: event.barangay_id,
        budget: event.budget?.toString() || '',
      });

      if (locationData.lat && locationData.lng) {
        setSelectedLocation({
          address: locationData.address,
          lat: locationData.lat,
          lng: locationData.lng,
        });
      }

      setThumbnailPreview(event.thumbnail_url || null);
      setThumbnailFile(null);
    }
  }, [event, open, form]);

  const fetchBarangays = async () => {
    const { data, error } = await supabase
      .from('barangays')
      .select('id, name, code')
      .order('name');

    if (error) {
      console.error('Error fetching barangays:', error);
    } else {
      setBarangays(data || []);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (!event) return;
    
    setIsLoading(true);
    
    try {
      const locationData = selectedLocation 
        ? JSON.stringify({
            address: data.location,
            coordinates: {
              lat: selectedLocation.lat,
              lng: selectedLocation.lng
            }
          })
        : data.location;

      let thumbnailUrl: string | null = event.thumbnail_url || null;

      // Upload thumbnail if a new file is provided
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-thumbnails')
          .upload(fileName, thumbnailFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-thumbnails')
          .getPublicUrl(fileName);
        
        thumbnailUrl = publicUrl;
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: data.title,
          description: data.description,
          location: locationData,
          event_date: new Date(data.event_date).toISOString(),
          barangay_id: data.barangay_id,
          thumbnail_url: thumbnailUrl,
          budget: data.budget ? parseFloat(data.budget) : null,
        })
        .eq('id', event.id);

      if (error) throw error;

      // Log the audit
      await logAudit({
        action: "event_update",
        tableName: "events",
        recordId: event.id,
        barangayId: data.barangay_id,
        details: {
          title: data.title,
          event_date: data.event_date,
          budget: data.budget ? parseFloat(data.budget) : null,
        },
      });

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      onOpenChange(false);
      onEventUpdated();
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event title" {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                      placeholder="Event description" 
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Event location in Tayum, Abra" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!selectedLocation) {
                          setSelectedLocation(null);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <MapboxLocationPicker
              onLocationSelect={(location) => {
                setSelectedLocation(location);
                form.setValue('location', location.address);
              }}
              selectedLocation={selectedLocation}
            />
            
            <FormField
              control={form.control}
              name="event_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Date & Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (PHP) - Optional</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="Enter budget amount"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Event Thumbnail - Optional</FormLabel>
              <Input 
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="mt-2"
              />
              {thumbnailPreview && (
                <div className="mt-3">
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail preview" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Event'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
