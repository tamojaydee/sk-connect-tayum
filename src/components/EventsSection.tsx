import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { EventDetailsDialog } from './EventDetailsDialog';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  status: string;
  barangay_id: string;
  thumbnail_url?: string;
  budget?: number;
  barangays?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface Barangay {
  id: string;
  name: string;
}

export const EventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarangays();
    fetchEvents();
  }, []);

  const fetchBarangays = async () => {
    const { data } = await supabase
      .from('barangays')
      .select('id, name')
      .order('name');
    
    if (data) setBarangays(data);
  };

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*, barangays(name), profiles(full_name)')
      .eq('status', 'active')
      .order('event_date', { ascending: true });
    
    if (data) setEvents(data);
    setLoading(false);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBarangay = selectedBarangay === 'all' || event.barangay_id === selectedBarangay;
    return matchesSearch && matchesBarangay;
  });

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const parseLocation = (location: string) => {
    try {
      const parsed = JSON.parse(location);
      return parsed.address;
    } catch {
      return location;
    }
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-4">
            Upcoming Events
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay updated with youth activities and community events across Tayum
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="md:w-64">
            <Select value={selectedBarangay} onValueChange={setSelectedBarangay}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by barangay" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barangays</SelectItem>
                {barangays.map((barangay) => (
                  <SelectItem key={barangay.id} value={barangay.id}>
                    {barangay.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card 
                key={event.id} 
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden"
                onClick={() => handleEventClick(event)}
              >
                {event.thumbnail_url && (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={event.thumbnail_url} 
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                )}
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                    {event.barangays && (
                      <Badge variant="secondary" className="mb-2">
                        {event.barangays.name}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.event_date), 'PPP')}</span>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{parseLocation(event.location)}</span>
                  </div>

                  {event.budget && (
                    <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-md">
                      <span className="text-xs font-medium">Budget:</span>
                      <span className="text-sm font-semibold text-primary">
                        ₱{event.budget.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {event.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Event Details Dialog */}
        <EventDetailsDialog
          event={selectedEvent}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>
    </section>
  );
};
