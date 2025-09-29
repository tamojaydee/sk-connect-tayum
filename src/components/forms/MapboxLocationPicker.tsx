import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');

  // Tayum, Abra coordinates
  const TAYUM_CENTER: [number, number] = [120.7458, 17.4851]; // [lng, lat]

  useEffect(() => {
    // For now, we'll use a placeholder token input
    // In production, this should come from Supabase secrets
    const token = prompt('Please enter your Mapbox public token (get one from https://mapbox.com):');
    if (token) {
      setMapboxToken(token);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: TAYUM_CENTER,
      zoom: 14,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

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
  }, [mapboxToken, onLocationSelect]);

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
      marker.current = new mapboxgl.Marker()
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;
    
    setIsSearching(true);
    
    try {
      // Use Mapbox Geocoding API for Tayum, Abra
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery + ', Tayum, Abra, Philippines')}.json?access_token=${mapboxToken}&limit=5&proximity=${TAYUM_CENTER[0]},${TAYUM_CENTER[1]}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        const location = {
          address: feature.place_name || searchQuery,
          lat,
          lng
        };
        
        onLocationSelect(location);
      } else {
        // Fallback to predefined locations
        const tayumLocations = [
          { address: 'Tayum Municipal Hall', lat: 17.4851, lng: 120.7458 },
          { address: 'Tayum Public Plaza', lat: 17.4845, lng: 120.7465 },
          { address: 'Tayum Elementary School', lat: 17.4860, lng: 120.7450 },
          { address: 'Tayum Health Center', lat: 17.4840, lng: 120.7470 },
          { address: 'Tayum Sports Complex', lat: 17.4855, lng: 120.7445 },
        ];
        
        const found = tayumLocations.find(loc => 
          loc.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (found) {
          onLocationSelect(found);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (!mapboxToken) {
    return (
      <div className="space-y-4">
        <div className="text-center p-4 border rounded-md bg-muted/50">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Mapbox token required to display the map
          </p>
          <Button 
            onClick={() => {
              const token = prompt('Please enter your Mapbox public token:');
              if (token) setMapboxToken(token);
            }}
            variant="outline"
            size="sm"
          >
            Enter Mapbox Token
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Get your free token at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

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