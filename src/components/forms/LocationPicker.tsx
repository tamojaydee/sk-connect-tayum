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

  // Tayum, Abra coordinates
  const TAYUM_CENTER = { lat: 17.4851, lng: 120.7458 };
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Predefined locations in Tayum, Abra
    setTimeout(() => {
      const tayumLocations = [
        { address: 'Tayum Municipal Hall', lat: 17.4851, lng: 120.7458 },
        { address: 'Tayum Public Plaza', lat: 17.4845, lng: 120.7465 },
        { address: 'Tayum Elementary School', lat: 17.4860, lng: 120.7450 },
        { address: 'Tayum Health Center', lat: 17.4840, lng: 120.7470 },
        { address: 'Tayum Sports Complex', lat: 17.4855, lng: 120.7445 },
        { address: 'Barangay San Jose Hall', lat: 17.4870, lng: 120.7440 },
        { address: 'Barangay Poblacion Center', lat: 17.4848, lng: 120.7462 },
        { address: 'Barangay Suyo Community Center', lat: 17.4835, lng: 120.7475 },
        { address: 'Tayum Market', lat: 17.4843, lng: 120.7467 },
        { address: 'Tayum Church', lat: 17.4852, lng: 120.7460 }
      ];
      
      const found = tayumLocations.find(loc => 
        loc.address.toLowerCase().includes(searchQuery.toLowerCase())
      ) || { 
        address: searchQuery, 
        lat: TAYUM_CENTER.lat + (Math.random() - 0.5) * 0.01, 
        lng: TAYUM_CENTER.lng + (Math.random() - 0.5) * 0.01 
      };
      
      onLocationSelect(found);
      setIsSearching(false);
    }, 800);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click position to Tayum, Abra coordinates
    const lat = TAYUM_CENTER.lat + (0.5 - y / rect.height) * 0.02;
    const lng = TAYUM_CENTER.lng + (x / rect.width - 0.5) * 0.02;
    
    const newLocation = {
      address: `Tayum Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
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
              left: `${50 + ((selectedLocation.lng - TAYUM_CENTER.lng) / 0.02) * 50}%`,
              top: `${50 + ((TAYUM_CENTER.lat - selectedLocation.lat) / 0.02) * 50}%`
            }}
          >
            <MapPin className="h-6 w-6 text-primary drop-shadow-lg" fill="currentColor" />
          </div>
        )}
        
        {/* Instructions overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground bg-background/80 backdrop-blur-sm p-4 rounded-md">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Tayum, Abra Map</p>
            <p className="text-xs">Click anywhere to select location in Tayum</p>
          </div>
        </div>
        
        {/* Tayum landmarks overlay */}
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm p-2 rounded text-xs">
          <p className="font-medium text-primary">Tayum, Abra</p>
          <p className="text-muted-foreground">Municipality Map</p>
        </div>
      </div>
    </div>
  );
};