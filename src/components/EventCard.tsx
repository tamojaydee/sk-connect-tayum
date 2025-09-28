import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, User, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  status: string;
  created_by: string;
  profiles?: {
    full_name: string;
  };
}

interface EventCardProps {
  event: Event;
  canEdit?: boolean;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  canEdit = false,
  onEdit,
  onDelete,
}) => {
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

  const locationData = parseLocation(event.location);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(event.event_date), 'PPP p')}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {event.profiles?.full_name || 'Unknown'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(event.status)}>
              {event.status}
            </Badge>
            {canEdit && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(event)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete?.(event.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {event.description && (
          <p className="text-muted-foreground">{event.description}</p>
        )}
        
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">{locationData.address}</p>
            {locationData.coordinates && (
              <div className="mt-2 h-32 bg-muted rounded-md flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-xs">Map view would show here</p>
                  <p className="text-xs">
                    {locationData.coordinates.lat.toFixed(4)}, {locationData.coordinates.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};