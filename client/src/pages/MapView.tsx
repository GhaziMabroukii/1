import { useState, useEffect, useRef } from "react";
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

  useEffect(() => {
    fetchProperties();
    initializeGoogleMaps();
    
    return () => {
      // Cleanup
      if (markersRef.current) {
        markersRef.current.forEach(marker => {
          if (marker && typeof marker.setMap === 'function') {
            marker.setMap(null);
          }
        });
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
      
      const tunisAreas = [
        { name: "Centre Ville", lat: 36.8065, lng: 10.1815 },
        { name: "Bardo", lat: 36.8108, lng: 10.1372 },
        { name: "Ariana", lat: 36.8625, lng: 10.1956 },
        { name: "La Marsa", lat: 36.8785, lng: 10.3246 },
        { name: "Sidi Bou Said", lat: 36.8687, lng: 10.3487 },
        { name: "Carthage", lat: 36.8563, lng: 10.3310 },
        { name: "Manouba", lat: 36.8103, lng: 10.0989 },
        { name: "Ben Arous", lat: 36.7544, lng: 10.2277 }
      ];

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

  const initializeGoogleMaps = () => {
    // Global initMap callback function
    window.initMapCallback = () => {
      console.log("Map callback triggered");
      if (mapRef.current && !mapInstance.current) {
        try {
          mapInstance.current = new window.google.maps.Map(mapRef.current, {
            zoom: 12,
            center: { lat: 36.8065, lng: 10.1815 },
            mapTypeId: window.google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: false
          });
          console.log("Map initialized successfully");
          
          // Wait a bit then add markers
          setTimeout(() => {
            console.log("Adding markers after delay, properties count:", filteredProperties.length);
            updateMapMarkers();
          }, 500);
        } catch (error) {
          console.error("Error creating map:", error);
        }
      }
    };

    // Try to initialize immediately if Google is already loaded
    if (window.google && window.google.maps) {
      window.initMapCallback();
    }
  };

  const updateMapMarkers = () => {
    if (!mapInstance.current) {
      console.log("Map instance not ready");
      return;
    }

    if (!filteredProperties.length) {
      console.log("No properties to display");
      return;
    }

    console.log(`Adding ${filteredProperties.length} markers to map`);

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // Add new markers
    filteredProperties.forEach((property, index) => {
      console.log(`Creating marker ${index + 1} for property:`, property.title, property.coordinates);
      
      try {
        const marker = new window.google.maps.Marker({
          position: property.coordinates,
          map: mapInstance.current,
          title: property.title,
          icon: createPropertyIcon(property)
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; max-width: 280px; font-family: Arial, sans-serif;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${property.title}</h3>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">📍 ${property.location}</p>
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #f59e0b; font-size: 18px;">${property.price} TND/${property.priceType || 'mois'}</p>
              <div style="margin-bottom: 10px;">
                <span style="background: ${property.status === 'Disponible' ? '#dcfce7' : '#fee2e2'}; color: ${property.status === 'Disponible' ? '#166534' : '#dc2626'}; padding: 3px 8px; border-radius: 4px; font-size: 12px;">
                  ${property.status === 'Disponible' ? '✅ Disponible' : '🚫 ' + property.status}
                </span>
                ${property.furnished ? '<span style="background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-left: 4px;">🛋️ Meublé</span>' : '<span style="background: #f3f4f6; color: #374151; padding: 3px 8px; border-radius: 4px; font-size: 12px; margin-left: 4px;">🏠 Non meublé</span>'}
              </div>
              <button onclick="window.location.href='/property/${property.id}'" 
                      style="width: 100%; margin-top: 8px; padding: 8px 12px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
                Voir les détails →
              </button>
            </div>
          `
        });

        marker.addListener('click', () => {
          // Close other info windows
          markersRef.current.forEach(m => {
            if (m.infoWindow) {
              m.infoWindow.close();
            }
          });
          infoWindow.open(mapInstance.current, marker);
        });

        marker.infoWindow = infoWindow;
        markersRef.current.push(marker);
        console.log(`Marker ${index + 1} added successfully`);
      } catch (error) {
        console.error(`Error creating marker for property ${property.title}:`, error);
      }
    });

    // Fit bounds to show all markers
    if (filteredProperties.length > 0) {
      try {
        const bounds = new window.google.maps.LatLngBounds();
        filteredProperties.forEach(property => {
          bounds.extend(property.coordinates);
        });
        mapInstance.current.fitBounds(bounds, { padding: 50 });
        
        // Don't zoom too close for single property
        if (filteredProperties.length === 1) {
          setTimeout(() => {
            if (mapInstance.current && mapInstance.current.getZoom() > 16) {
              mapInstance.current.setZoom(16);
            }
          }, 500);
        }
        console.log("Map bounds adjusted to fit all markers");
      } catch (error) {
        console.error("Error fitting bounds:", error);
      }
    }
  };

  const createPropertyIcon = (property: any) => {
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
    // Use real status field from database
    const isAvailable = property.status === 'Disponible';
    const color = isAvailable ? '#10B981' : '#EF4444';
    const shadowColor = isAvailable ? '#065F46' : '#991B1B';
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg width="50" height="60" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="0" y="0" width="200%" height="200%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
            </filter>
            <radialGradient id="grad" cx="50%" cy="30%" r="60%">
              <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${shadowColor};stop-opacity:1" />
            </radialGradient>
          </defs>
          <circle cx="25" cy="22" r="18" fill="url(#grad)" stroke="white" stroke-width="3" filter="url(#shadow)"/>
          <text x="25" y="30" text-anchor="middle" font-size="16" fill="white" font-weight="bold">${icon}</text>
          <polygon points="25,40 20,52 30,52" fill="url(#grad)" stroke="white" stroke-width="2" filter="url(#shadow)"/>
        </svg>`
      )}`,
      scaledSize: new window.google.maps.Size(50, 60),
      anchor: new window.google.maps.Point(25, 52)
    };
  };

  // Filter properties
  useEffect(() => {
    let filtered = [...properties];

    if (searchQuery) {
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (propertyType && propertyType !== "all") {
      filtered = filtered.filter(property => property.type === propertyType);
    }

    if (rentalPeriod && rentalPeriod !== "all") {
      filtered = filtered.filter(property => property.priceType === rentalPeriod);
    }

    if (maxPrice && maxPrice !== "all") {
      const price = parseInt(maxPrice);
      filtered = filtered.filter(property => parseFloat(property.price) <= price);
    }

    if (equipmentFilters.furnished || equipmentFilters.unfurnished || equipmentFilters.parking) {
      filtered = filtered.filter(property => {
        const amenities = property.amenities || [];
        
        // Check furnished status using real database field
        if (equipmentFilters.furnished && !property.furnished) return false;
        if (equipmentFilters.unfurnished && property.furnished) return false;
        
        // Check parking in amenities array
        const hasParking = amenities.includes('parking') || amenities.includes('Parking');
        if (equipmentFilters.parking && !hasParking) return false;
        
        return true;
      });
    }

    setFilteredProperties(filtered);
  }, [properties, searchQuery, propertyType, rentalPeriod, maxPrice, equipmentFilters]);

  // Update markers when filtered properties change
  useEffect(() => {
    if (mapInstance.current && filteredProperties.length > 0) {
      console.log("Updating markers due to filteredProperties change:", filteredProperties.length);
      updateMapMarkers();
    }
  }, [filteredProperties]);

  // Ensure markers are updated after properties are loaded
  useEffect(() => {
    if (mapInstance.current && properties.length > 0 && !loading) {
      console.log("Properties loaded, updating markers:", properties.length);
      setTimeout(() => updateMapMarkers(), 500);
    }
  }, [properties, loading]);

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
                  <SelectItem value="50">Jusqu'à 50 TND</SelectItem>
                  <SelectItem value="100">Jusqu'à 100 TND</SelectItem>
                  <SelectItem value="200">Jusqu'à 200 TND</SelectItem>
                  <SelectItem value="500">Jusqu'à 500 TND</SelectItem>
                  <SelectItem value="1000">Jusqu'à 1000 TND</SelectItem>
                  <SelectItem value="1500">Jusqu'à 1500 TND</SelectItem>
                  <SelectItem value="2000">Jusqu'à 2000 TND</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <label className="text-sm font-semibold mb-2 block">Équipements</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="furnished" 
                      checked={equipmentFilters.furnished}
                      onCheckedChange={(checked) => 
                        setEquipmentFilters(prev => ({ ...prev, furnished: checked === true }))
                      }
                    />
                    <label htmlFor="furnished" className="text-sm">🛏️ Meublé</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="unfurnished" 
                      checked={equipmentFilters.unfurnished}
                      onCheckedChange={(checked) => 
                        setEquipmentFilters(prev => ({ ...prev, unfurnished: checked === true }))
                      }
                    />
                    <label htmlFor="unfurnished" className="text-sm">🏠 Non meublé</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="parking" 
                      checked={equipmentFilters.parking}
                      onCheckedChange={(checked) => 
                        setEquipmentFilters(prev => ({ ...prev, parking: checked === true }))
                      }
                    />
                    <label htmlFor="parking" className="text-sm">🚗 Parking</label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 overflow-hidden">
          <div className="relative">
            <div 
              ref={mapRef}
              className="w-full h-96 lg:h-[600px] bg-gray-200"
              style={{ minHeight: '500px' }}
            />
            {/* Map loading indicator */}
            {(!mapInstance.current || loading) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg">
                <div className="text-center text-foreground">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
                  <p className="font-medium text-lg">Chargement de la carte...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {loading ? 'Récupération des propriétés...' : 'Initialisation de Google Maps...'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Propriétés: {filteredProperties.length} | Map: {mapInstance.current ? 'Ready' : 'Loading'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            🗺️ Cliquez sur les marqueurs pour voir les détails des propriétés
          </p>
          
          {/* Legend */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="text-sm font-semibold text-foreground mb-3">Légende des propriétés</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏠</span>
                <span className="text-muted-foreground">Studio</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏢</span>
                <span className="text-muted-foreground">Appartement</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏖️</span>
                <span className="text-muted-foreground">Villa</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🏘️</span>
                <span className="text-muted-foreground">Maison</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🛏️</span>
                <span className="text-muted-foreground">Chambre</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">Disponible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;