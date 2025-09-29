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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate location search with some predefined locations
    setTimeout(() => {
      const locations = [
        { address: 'Barangay Hall', lat: 14.5995, lng: 120.9842 },
        { address: 'Community Center', lat: 14.6042, lng: 120.9822 },
        { address: 'Public Plaza', lat: 14.5968, lng: 120.9876 },
        { address: 'Sports Complex', lat: 14.6015, lng: 120.9798 },
        { address: 'School Grounds', lat: 14.5978, lng: 120.9834 }
      ];
      
      const found = locations.find(loc => 
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
      ) || { 
        address: searchQuery, 
        lat: 14.5995 + (Math.random() - 0.5) * 0.01, 
        lng: 120.9842 + (Math.random() - 0.5) * 0.01 
      };
      
      onLocationSelect(found);
      setIsSearching(false);
    }, 800);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click position to coordinates (simple mapping)
    const lat = 14.5995 + (0.5 - y / rect.height) * 0.02;
    const lng = 120.9842 + (x / rect.width - 0.5) * 0.02;
    
    const newLocation = {
      address: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6))
    };
    
    onLocationSelect(newLocation);
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
      
      <div 
        className="h-48 bg-gradient-to-br from-muted/50 to-muted rounded-md border-2 border-dashed border-muted-foreground/20 cursor-crosshair relative overflow-hidden hover:border-primary/30 transition-colors"
        onClick={handleMapClick}
      >
        {/* Simple grid background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" className="h-full w-full">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Location marker if selected */}
        {selectedLocation && (
          <div 
            className="absolute w-6 h-6 transform -translate-x-3 -translate-y-6 pointer-events-none"
            style={{
              left: `${50 + ((selectedLocation.lng - 120.9842) / 0.02) * 50}%`,
              top: `${50 + ((14.5995 - selectedLocation.lat) / 0.02) * 50}%`
            }}
          >
            <MapPin className="h-6 w-6 text-primary drop-shadow-lg" fill="currentColor" />
          </div>
        )}
        
        {/* Instructions overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground bg-background/80 backdrop-blur-sm p-4 rounded-md">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Interactive Map</p>
            <p className="text-xs">Click anywhere to select location</p>
          </div>
        </div>
      </div>
    </div>
  );
};