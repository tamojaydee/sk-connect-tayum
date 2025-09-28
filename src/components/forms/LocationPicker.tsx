import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  selectedLocation: { address: string; lat: number; lng: number } | null;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  selectedLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Placeholder for map integration
  // You can replace this with actual Google Maps or Mapbox implementation
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate location search - replace with actual implementation
    setTimeout(() => {
      // Mock location data - replace with actual geocoding
      const mockLocation = {
        address: searchQuery,
        lat: 14.5995, // Manila coordinates as example
        lng: 120.9842,
      };
      
      onLocationSelect(mockLocation);
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button 
          type="button"
          variant="outline" 
          onClick={handleSearch}
          disabled={isSearching}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {selectedLocation && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
          <MapPin className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">{selectedLocation.address}</p>
            <p className="text-xs text-muted-foreground">
              {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}
      
      <div className="h-48 bg-muted rounded-md flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Map will be displayed here</p>
          <p className="text-xs">Google Maps integration needed</p>
        </div>
      </div>
    </div>
  );
};