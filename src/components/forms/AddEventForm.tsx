import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { MapboxLocationPicker } from './MapboxLocationPicker';
import { logAudit } from '@/lib/auditLog';

const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().max(1000, "Description must be less than 1000 characters").optional(),
  location: z.string().trim().min(1, "Location is required").max(255, "Location must be less than 255 characters"),
  event_date: z.string().min(1, "Event date is required"),
  barangay_id: z.string().min(1, "Barangay is required"),
  budget: z.string().optional(),
  status: z.enum(['active', 'completed']).default('active'),
});

type EventFormData = z.infer<typeof eventSchema>;

interface Barangay {
  id: string;
  name: string;
  code: string;
}

interface AddEventFormProps {
  onEventAdded: () => void;
  userProfile: any;
}

export const AddEventForm: React.FC<AddEventFormProps> = ({ onEventAdded, userProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
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
      barangay_id: userProfile?.barangay_id || '',
      budget: '',
      status: 'active',
    },
  });

  useEffect(() => {
    fetchBarangays();
  }, []);

  const fallbackBarangays: Barangay[] = [
    { id: "48649d38-1d1e-4479-97a5-fd3091d1e587", name: "Baggalay", code: "BAG" },
    { id: "0a81c908-dcbd-44df-aea2-09362d996405", name: "Basbasa", code: "BAS" },
    { id: "1c028f8b-aa45-49ae-8115-cdb01275108b", name: "Budac", code: "BUD" },
    { id: "c68be595-b80e-43a3-b74b-b01f7a583214", name: "Bumagcat", code: "BUM" },
    { id: "e9192e9d-c578-467f-89fd-899aaaaebf03", name: "Cabaroan", code: "CAB" },
    { id: "e5e53e2d-c294-4ac9-b08e-af049ebbc3ce", name: "Deet", code: "DEE" },
    { id: "014df4c9-e234-4eb9-a39b-28998b23e890", name: "Gaddani", code: "GAD" },
    { id: "dc9c58fc-a035-4a0e-9a32-e285c976ab51", name: "Patucannay", code: "PAT" },
    { id: "5a224c8a-4678-448a-a606-b1c059ff4aba", name: "Pias", code: "PIA" },
    { id: "bc4bfd33-c5d0-4e1a-bb94-d14aadb88991", name: "Poblacion", code: "POB" },
    { id: "4a59e3b6-4e9a-42f6-a6c6-23cad568bba2", name: "Velasco", code: "VEL" },
  ];

  const fetchBarangays = async () => {
    const { data, error } = await supabase
      .from('barangays')
      .select('id, name, code')
      .order('name');

    if (error) {
      console.error('Error fetching barangays:', error);
      toast({
        title: "Error",
        description: "Failed to load barangays; using fallback list.",
        variant: "default",
      });
      setBarangays(fallbackBarangays);
    } else if (!data || data.length === 0) {
      console.warn('Barangays query returned empty; using fallback list.');
      toast({ title: 'Using fallback', description: 'Loaded default Tayum barangays.', variant: 'default' });
      setBarangays(fallbackBarangays);
    } else {
      setBarangays(data);
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

      let thumbnailUrl: string | null = null;

      // Upload thumbnail if provided
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

      const { data: newEvent, error } = await supabase
        .from('events')
        .insert({
          title: data.title,
          description: data.description,
          location: locationData,
          event_date: new Date(data.event_date).toISOString(),
          barangay_id: data.barangay_id,
          created_by: userProfile.id,
          thumbnail_url: thumbnailUrl,
          budget: data.budget ? parseFloat(data.budget) : null,
          status: data.status,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the audit
      await logAudit({
        action: "event_create",
        tableName: "events",
        recordId: newEvent.id,
        barangayId: data.barangay_id,
        details: {
          title: data.title,
          budget: data.budget ? parseFloat(data.budget) : null,
        },
      });

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      form.reset();
      setSelectedLocation(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setIsOpen(false);
      onEventAdded();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
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

            {userProfile?.role === 'sk_chairman' ? (
              <FormField
                control={form.control}
                name="barangay_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barangay</FormLabel>
                    <FormControl>
                      <Input 
                        value={barangays.find(b => b.id === field.value)?.name || 'Loading...'} 
                        disabled 
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
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
            )}
            
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active (Upcoming)</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
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
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};