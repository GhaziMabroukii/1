import { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
    initMapCallback?: () => void;
  }
}

interface PropertyLocationMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
}

export default function PropertyLocationMap({ latitude, longitude, title = "Property Location", address }: PropertyLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (latitude && longitude && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [latitude, longitude]);

  const initializeMap = async () => {
    try {
      // Wait for Google Maps to load
      if (!(window as any).google || !(window as any).google.maps) {
        setTimeout(() => initializeMap(), 1000);
        return;
      }

      const google = (window as any).google;
      
      const mapOptions = {
        center: { lat: latitude, lng: longitude },
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
      
      // Create marker for property location
      const propertyMarker = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
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

      // Add info window if address is provided
      if (address) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: Arial, sans-serif;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px;">${title}</h3>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">📍 ${address}</p>
            </div>
          `
        });

        propertyMarker.addListener('click', () => {
          infoWindow.open(googleMap, propertyMarker);
        });
      }

      mapInstanceRef.current = googleMap;
      
    } catch (error) {
      console.error('Error initializing property location map:', error);
    }
  };

  return (
    <div 
      ref={mapRef} 
      className="w-full h-64 rounded-lg border border-gray-200"
      style={{ minHeight: '256px' }}
    />
  );
}