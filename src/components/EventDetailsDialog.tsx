import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  status: string;
  barangays?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
}

interface EventDetailsDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({
  event,
  open,
  onOpenChange,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const parseLocation = (location: string) => {
    try {
      const parsed = JSON.parse(location);
      return {
        address: parsed.address,
        coordinates: parsed.coordinates,
      };
    } catch {
      return {
        address: location,
        coordinates: null,
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  useEffect(() => {
    if (!event || !open || !mapContainer.current) return;

    const locationData = parseLocation(event.location);
    if (!locationData.coordinates) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [locationData.coordinates.lng, locationData.coordinates.lat],
      zoom: 15,
    });

    // Add marker
    new maplibregl.Marker({ color: '#6A669D' })
      .setLngLat([locationData.coordinates.lng, locationData.coordinates.lat])
      .addTo(map.current);

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [event, open]);

  if (!event) return null;

  const locationData = parseLocation(event.location);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl">{event.title}</DialogTitle>
            <Badge className={getStatusColor(event.status)}>
              {event.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              <span>{format(new Date(event.event_date), 'PPP p')}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-5 w-5" />
              <span>{event.profiles?.full_name || 'Unknown'}</span>
            </div>

            {event.barangays && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>Barangay {event.barangays.name}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{event.description}</p>
            </div>
          )}

          {/* Location */}
          <div>
            <h3 className="font-semibold mb-2">Location</h3>
            <p className="text-muted-foreground mb-3">{locationData.address}</p>
            
            {locationData.coordinates && (
              <div 
                ref={mapContainer} 
                className="w-full h-[400px] rounded-lg overflow-hidden border border-border"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
