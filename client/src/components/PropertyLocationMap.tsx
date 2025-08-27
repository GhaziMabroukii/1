import { useEffect, useRef, useCallback } from "react";

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
  const markerRef = useRef<any>(null);

  const initializeMap = useCallback(async () => {
    if (!latitude || !longitude || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    try {
      // Wait for Google Maps to load efficiently
      if (!window.google?.maps) {
        setTimeout(initializeMap, 500);
        return;
      }

      const google = window.google;
      
      const mapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: true,
        fullscreenControl: false,
        gestureHandling: 'cooperative',
        backgroundColor: '#f8fafc',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      const googleMap = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = googleMap;
      
      // Create optimized marker
      markerRef.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: googleMap,
        draggable: false,
        title: title,
        optimized: true,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="shadow" x="0" y="0" width="150%" height="150%">
                  <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
                </filter>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#ef4444;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#dc2626;stop-opacity:1" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="12" fill="url(#grad)" stroke="white" stroke-width="2" filter="url(#shadow)"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
              <polygon points="16,28 12,36 20,36" fill="url(#grad)" stroke="white" stroke-width="1" filter="url(#shadow)"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 40),
          anchor: new google.maps.Point(16, 36)
        }
      });

      // Add optimized info window if address is provided
      if (address) {
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; font-family: 'Inter', Arial, sans-serif; max-width: 200px;">
              <h3 style="margin: 0 0 6px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${title}</h3>
              <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.4;">📍 ${address}</p>
            </div>
          `,
          maxWidth: 250,
          pixelOffset: new google.maps.Size(0, -10)
        });

        markerRef.current.addListener('click', () => {
          infoWindow.open(googleMap, markerRef.current);
        });
      }
      
    } catch (error) {
      console.error('Error initializing property location map:', error);
    }
  }, [latitude, longitude, title, address]);

  useEffect(() => {
    initializeMap();
    
    // Cleanup function
    return () => {
      if (markerRef.current?.setMap) {
        markerRef.current.setMap(null);
      }
      mapInstanceRef.current = null;
    };
  }, [initializeMap]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-64 rounded-lg border border-gray-200 bg-gray-50"
      style={{ 
        minHeight: '256px',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
      }}
    />
  );
}