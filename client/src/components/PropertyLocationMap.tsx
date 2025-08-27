import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface PropertyLocationMapProps {
  latitude: string | number;
  longitude: string | number;
  title: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const PropertyLocationMap = ({ latitude, longitude, title }: PropertyLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (latitude && longitude && mapRef.current) {
      initializeLocationMap();
    }
  }, [latitude, longitude]);

  const initializeLocationMap = async () => {
    try {
      // Wait for Google Maps to load
      if (!(window as any).google || !(window as any).google.maps) {
        setTimeout(() => initializeLocationMap(), 1000);
        return;
      }

      const google = (window as any).google;
      const lat = parseFloat(latitude.toString());
      const lng = parseFloat(longitude.toString());
      
      const mapOptions = {
        center: { lat, lng },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true
      };

      const googleMap = new google.maps.Map(mapRef.current, mapOptions);
      
      // Create marker for property location (non-draggable)
      const propertyMarker = new google.maps.Marker({
        position: { lat, lng },
        map: googleMap,
        draggable: false,
        title: title,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });
      
    } catch (error) {
      console.error('Error initializing location map:', error);
    }
  };

  const openInGoogleMaps = () => {
    if (latitude && longitude) {
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Localisation</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={openInGoogleMaps}
          className="flex items-center gap-2"
          data-testid="button-open-maps"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir dans Maps
        </Button>
      </div>
      
      <div className="rounded-lg overflow-hidden border">
        <div 
          ref={mapRef} 
          className="h-64 w-full bg-gray-100 dark:bg-gray-800"
          data-testid="property-location-map"
        />
      </div>
    </div>
  );
};

export default PropertyLocationMap;