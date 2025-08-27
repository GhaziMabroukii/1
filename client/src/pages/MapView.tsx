import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, MapPin, Search, Filter } from "lucide-react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    initMapCallback: () => void;
  }
}

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  
  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [propertyType, setPropertyType] = useState("all");
  const [maxPrice, setMaxPrice] = useState("all");
  const [rentalPeriod, setRentalPeriod] = useState("all");
  const [equipmentFilters, setEquipmentFilters] = useState({
    furnished: false,
    unfurnished: false,
    parking: false
  });
  
  const [, navigate] = useLocation();

  // Tunisia areas for fallback coordinates
  const tunisAreas = useMemo(() => [
    { name: "Centre Ville", lat: 36.8065, lng: 10.1815 },
    { name: "Bardo", lat: 36.8108, lng: 10.1372 },
    { name: "Ariana", lat: 36.8625, lng: 10.1956 },
    { name: "La Marsa", lat: 36.8785, lng: 10.3246 },
    { name: "Sidi Bou Said", lat: 36.8687, lng: 10.3487 },
    { name: "Carthage", lat: 36.8563, lng: 10.3310 },
    { name: "Manouba", lat: 36.8103, lng: 10.0989 },
    { name: "Ben Arous", lat: 36.7544, lng: 10.2277 }
  ], []);

  useEffect(() => {
    fetchProperties();
    initializeGoogleMaps();
    
    return () => {
      // Cleanup
      clearMarkers();
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/properties");
      
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      
      const fetchedProperties = await response.json();
      
      const propertiesWithCoordinates = fetchedProperties.map((property: any, index: number) => {
        const area = tunisAreas[index % tunisAreas.length];
        return {
          ...property,
          coordinates: {
            lat: parseFloat(property.latitude) || (area.lat + (Math.random() - 0.5) * 0.02),
            lng: parseFloat(property.longitude) || (area.lng + (Math.random() - 0.5) * 0.02)
          },
          location: property.address || property.location || area.name,
          price: parseFloat(property.price) || 0
        };
      });
      
      setProperties(propertiesWithCoordinates);
      setFilteredProperties(propertiesWithCoordinates);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
      setFilteredProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleMaps = useCallback(() => {
    window.initMapCallback = () => {
      if (mapRef.current && !mapInstance.current && window.google?.maps) {
        try {
          mapInstance.current = new window.google.maps.Map(mapRef.current, {
            zoom: 12,
            center: { lat: 36.8065, lng: 10.1815 },
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            gestureHandling: 'cooperative',
            backgroundColor: '#f8fafc',
            mapTypeControlOptions: {
              style: window.google.maps.MapTypeControlStyle.COMPACT,
              position: window.google.maps.ControlPosition.TOP_RIGHT
            }
          });
          
          // Single shared info window for better performance
          infoWindowRef.current = new window.google.maps.InfoWindow({
            maxWidth: 300,
            pixelOffset: new window.google.maps.Size(0, -10)
          });
          
        } catch (error) {
          console.error("Error creating map:", error);
        }
      }
    };

    // Initialize immediately if Google is already loaded
    if (window.google?.maps) {
      window.initMapCallback();
    }
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      if (marker?.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];
  }, []);

  const updateMapMarkers = useCallback(() => {
    if (!mapInstance.current || !filteredProperties.length) {
      return;
    }

    // Clear existing markers efficiently
    clearMarkers();

    // Create bounds for optimal viewport
    const bounds = new window.google.maps.LatLngBounds();
    let hasValidCoordinates = false;

    // Batch create markers for better performance
    const newMarkers = filteredProperties.map((property) => {
      if (!property.coordinates?.lat || !property.coordinates?.lng) {
        return null;
      }

      bounds.extend(property.coordinates);
      hasValidCoordinates = true;

      const marker = new window.google.maps.Marker({
        position: property.coordinates,
        map: mapInstance.current,
        title: property.title,
        icon: createPropertyIcon(property),
        optimized: true, // Enable marker optimization
        animation: null // Disable animations for better performance
      });

      // Use single shared info window
      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(createInfoWindowContent(property));
          infoWindowRef.current.open(mapInstance.current, marker);
        }
      });

      return marker;
    }).filter(Boolean);

    markersRef.current = newMarkers;

    // Fit bounds efficiently
    if (hasValidCoordinates) {
      mapInstance.current.fitBounds(bounds, { padding: 50 });
      
      // Prevent over-zooming for single properties
      if (filteredProperties.length === 1) {
        const listener = window.google.maps.event.addListenerOnce(mapInstance.current, 'bounds_changed', () => {
          if (mapInstance.current.getZoom() > 16) {
            mapInstance.current.setZoom(16);
          }
        });
      }
    }
  }, [filteredProperties, clearMarkers]);

  const createInfoWindowContent = useCallback((property: any) => {
    return `
      <div style="padding: 12px; max-width: 280px; font-family: 'Inter', Arial, sans-serif; line-height: 1.4;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">${property.title}</h3>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">📍 ${property.location}</p>
        <p style="margin: 0 0 10px 0; font-weight: 700; color: #f59e0b; font-size: 18px;">${property.price} TND/${property.priceType || 'mois'}</p>
        <div style="margin-bottom: 10px;">
          <span style="background: ${property.status === 'Disponible' ? '#dcfce7' : '#fee2e2'}; color: ${property.status === 'Disponible' ? '#166534' : '#dc2626'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
            ${property.status === 'Disponible' ? '✅ Disponible' : '🚫 ' + property.status}
          </span>
          ${property.furnished ? '<span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 4px; font-weight: 500;">🛋️ Meublé</span>' : '<span style="background: #f3f4f6; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 4px;">🏠 Non meublé</span>'}
        </div>
        <button onclick="window.location.href='/property/${property.id}'" 
                style="width: 100%; margin-top: 8px; padding: 10px 12px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: transform 0.2s;">
          Voir les détails →
        </button>
      </div>
    `;
  }, []);

  const createPropertyIcon = useCallback((property: any) => {
    const type = property.type?.toLowerCase() || 'apartment';
    const typeIcons: { [key: string]: string } = {
      'studio': '🏠',
      'apartment': '🏢', 
      'appartement': '🏢',
      'villa': '🏡',
      'maison': '🏘️',
      'maison_ete': '🏖️',
      'chambre': '🛏️',
      'bureau': '🏢',
      'magasin': '🏪',
      'shop': '🏪'
    };
    
    const icon = typeIcons[type] || '🏢';
    const isAvailable = property.status === 'Disponible';
    const color = isAvailable ? '#10B981' : '#EF4444';
    const shadowColor = isAvailable ? '#065F46' : '#991B1B';
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="0" y="0" width="150%" height="150%">
              <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="#000000" flood-opacity="0.3"/>
            </filter>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${shadowColor};stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="18" r="15" fill="url(#grad)" stroke="white" stroke-width="2" filter="url(#shadow)"/>
          <text x="20" y="25" text-anchor="middle" font-size="14" fill="white" font-weight="bold">${icon}</text>
          <polygon points="20,33 16,43 24,43" fill="url(#grad)" stroke="white" stroke-width="1" filter="url(#shadow)"/>
        </svg>`
      )}`,
      scaledSize: new window.google.maps.Size(40, 48),
      anchor: new window.google.maps.Point(20, 43)
    };
  }, []);

  // Optimized filtering with useMemo
  const filteredPropertiesData = useMemo(() => {
    let filtered = [...properties];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(query) ||
        property.location?.toLowerCase().includes(query) ||
        property.address?.toLowerCase().includes(query)
      );
    }

    if (propertyType !== "all") {
      filtered = filtered.filter(property => property.type === propertyType);
    }

    if (rentalPeriod !== "all") {
      filtered = filtered.filter(property => property.priceType === rentalPeriod);
    }

    if (maxPrice !== "all") {
      const price = parseInt(maxPrice);
      filtered = filtered.filter(property => parseFloat(property.price) <= price);
    }

    if (equipmentFilters.furnished || equipmentFilters.unfurnished || equipmentFilters.parking) {
      filtered = filtered.filter(property => {
        const amenities = property.amenities || [];
        
        if (equipmentFilters.furnished && !property.furnished) return false;
        if (equipmentFilters.unfurnished && property.furnished) return false;
        
        const hasParking = amenities.some((amenity: string) => 
          amenity.toLowerCase().includes('parking')
        );
        if (equipmentFilters.parking && !hasParking) return false;
        
        return true;
      });
    }

    return filtered;
  }, [properties, searchQuery, propertyType, rentalPeriod, maxPrice, equipmentFilters]);

  // Update filtered properties efficiently
  useEffect(() => {
    setFilteredProperties(filteredPropertiesData);
  }, [filteredPropertiesData]);

  // Update markers when filtered properties change
  useEffect(() => {
    if (mapInstance.current && !loading) {
      const timeoutId = setTimeout(() => {
        updateMapMarkers();
      }, 100); // Small debounce for smoother performance
      
      return () => clearTimeout(timeoutId);
    }
  }, [filteredProperties, loading, updateMapMarkers]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/search")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold gradient-text flex items-center space-x-3">
              <MapPin className="h-8 w-8 text-primary" />
              <span>Carte Interactive</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              {loading ? 'Chargement...' : `${filteredProperties.length} propriété(s) trouvée(s)`}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par lieu, type de bien..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de bien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous types</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="apartment">Appartement</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                  <SelectItem value="maison">Maison</SelectItem>
                  <SelectItem value="maison_ete">☀️ Maison d'été</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={rentalPeriod} onValueChange={setRentalPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Période de location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes périodes</SelectItem>
                  <SelectItem value="jour">🌅 Par jour</SelectItem>
                  <SelectItem value="nuit">🌙 Par nuit</SelectItem>
                  <SelectItem value="semaine">📅 Par semaine</SelectItem>
                  <SelectItem value="mois">📊 Par mois</SelectItem>
                  <SelectItem value="annee">🗓️ Par année</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={maxPrice} onValueChange={setMaxPrice}>
                <SelectTrigger>
                  <SelectValue placeholder="Prix max" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous prix</SelectItem>
                  <SelectItem value="500">≤ 500 TND</SelectItem>
                  <SelectItem value="1000">≤ 1000 TND</SelectItem>
                  <SelectItem value="2000">≤ 2000 TND</SelectItem>
                  <SelectItem value="5000">≤ 5000 TND</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="furnished" 
                    checked={equipmentFilters.furnished}
                    onCheckedChange={(checked) => 
                      setEquipmentFilters(prev => ({ ...prev, furnished: !!checked }))
                    }
                  />
                  <label htmlFor="furnished" className="text-sm">🛋️ Meublé</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="unfurnished" 
                    checked={equipmentFilters.unfurnished}
                    onCheckedChange={(checked) => 
                      setEquipmentFilters(prev => ({ ...prev, unfurnished: !!checked }))
                    }
                  />
                  <label htmlFor="unfurnished" className="text-sm">🏠 Non meublé</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="parking" 
                    checked={equipmentFilters.parking}
                    onCheckedChange={(checked) => 
                      setEquipmentFilters(prev => ({ ...prev, parking: !!checked }))
                    }
                  />
                  <label htmlFor="parking" className="text-sm">🚗 Parking</label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="relative h-[70vh] min-h-[500px] rounded-xl overflow-hidden shadow-2xl border border-white/20">
          {loading ? (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Chargement de la carte...</p>
              </div>
            </div>
          ) : (
            <div 
              ref={mapRef} 
              className="w-full h-full"
              style={{ minHeight: '500px' }}
            />
          )}
          
          {!loading && filteredProperties.length === 0 && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Aucune propriété trouvée</p>
                <p className="text-gray-500 text-sm mt-2">Modifiez vos filtres pour voir plus de résultats</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {filteredProperties.length === 0 ? (
                "Aucune propriété ne correspond à vos critères"
              ) : (
                `${filteredProperties.length} propriété${filteredProperties.length > 1 ? 's' : ''} affichée${filteredProperties.length > 1 ? 's' : ''} sur la carte`
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;