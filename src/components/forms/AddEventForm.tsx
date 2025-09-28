import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { LocationPicker } from './LocationPicker';

interface EventFormData {
  title: string;
  description: string;
  location: string;
  event_date: string;
}

interface AddEventFormProps {
  onEventAdded: () => void;
  userProfile: any;
}

export const AddEventForm: React.FC<AddEventFormProps> = ({ onEventAdded, userProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  
  const { toast } = useToast();
  
  const form = useForm<EventFormData>({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      event_date: '',
    },
  });

  const onSubmit = async (data: EventFormData) => {
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
      const locationData = selectedLocation 
        ? JSON.stringify({
            address: data.location,
            coordinates: {
              lat: selectedLocation.lat,
              lng: selectedLocation.lng
            }
          })
        : data.location;

      const { error } = await supabase
        .from('events')
        .insert({
          title: data.title,
          description: data.description,
          location: locationData,
          event_date: new Date(data.event_date).toISOString(),
          barangay_id: userProfile.barangay_id,
          created_by: userProfile.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      form.reset();
      setSelectedLocation(null);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              rules={{ required: "Title is required" }}
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
              rules={{ required: "Location is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Event location" 
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

            <LocationPicker
              onLocationSelect={(location) => {
                setSelectedLocation(location);
                form.setValue('location', location.address);
              }}
              selectedLocation={selectedLocation}
            />
            
            <FormField
              control={form.control}
              name="event_date"
              rules={{ required: "Event date is required" }}
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