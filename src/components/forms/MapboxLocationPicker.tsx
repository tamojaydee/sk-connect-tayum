import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Search } from 'lucide-react';

interface Location {
  address: string;
  lat: number;
  lng: number;
}

interface MapboxLocationPickerProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
}

export const MapboxLocationPicker: React.FC<MapboxLocationPickerProps> = ({
  onLocationSelect,
  selectedLocation
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Tayum, Abra coordinates
  const TAYUM_CENTER: [number, number] = [120.7458, 17.4851]; // [lng, lat]

  useEffect(() => {
    if (!mapContainer.current) return;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: TAYUM_CENTER,
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add click event to select location
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      const newLocation = {
        address: `Tayum Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng
      };
      
      onLocationSelect(newLocation);
      setMarker(lat, lng);
    });

    return () => {
      map.current?.remove();
    };
  }, [onLocationSelect]);

  useEffect(() => {
    if (selectedLocation && map.current) {
      setMarker(selectedLocation.lat, selectedLocation.lng);
      map.current.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 16
      });
    }
  }, [selectedLocation]);

  const setMarker = (lat: number, lng: number) => {
    if (marker.current) {
      marker.current.remove();
    }
    
    if (map.current) {
      marker.current = new maplibregl.Marker()
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Use predefined locations in Tayum, Abra
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
      );
      
      if (found) {
        onLocationSelect(found);
      } else {
        // Create a location with the search query
        const newLocation = {
          address: searchQuery,
          lat: TAYUM_CENTER[1] + (Math.random() - 0.5) * 0.01,
          lng: TAYUM_CENTER[0] + (Math.random() - 0.5) * 0.01
        };
        onLocationSelect(newLocation);
      }
      
      setIsSearching(false);
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search for a location in Tayum, Abra..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button 
          onClick={handleSearch} 
          disabled={isSearching || !searchQuery.trim()}
          variant="outline"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {selectedLocation && (
        <div className="text-sm p-2 bg-muted rounded border">
          <strong>Selected:</strong> {selectedLocation.address}
        </div>
      )}
      
      <div 
        ref={mapContainer}
        className="h-64 w-full rounded-md border"
        style={{ minHeight: '256px' }}
      />
      
      <p className="text-xs text-muted-foreground text-center">
        Click anywhere on the map to select a location in Tayum, Abra
      </p>
    </div>
  );
};