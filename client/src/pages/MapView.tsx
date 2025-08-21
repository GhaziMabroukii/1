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
    // Global initMap function for callback
    window.initMap = () => {
      if (mapRef.current && !mapInstance.current) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          zoom: 12,
          center: { lat: 36.8065, lng: 10.1815 },
          mapTypeId: window.google.maps.MapTypeId.ROADMAP
        });
        console.log("Map initialized");
        updateMapMarkers();
      }
    };
  };

  const updateMapMarkers = () => {
    if (!mapInstance.current || !filteredProperties.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    markersRef.current = [];

    // Add new markers
    filteredProperties.forEach((property) => {
      const marker = new window.google.maps.Marker({
        position: property.coordinates,
        map: mapInstance.current,
        title: property.title,
        icon: createPropertyIcon(property)
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 5px 0;">${property.title}</h3>
            <p style="margin: 0 0 5px 0; color: #666;">📍 ${property.location}</p>
            <p style="margin: 0; font-weight: bold; color: #f59e0b;">${property.price} TND/mois</p>
            <button onclick="window.location.href='/property/${property.id}'" 
                    style="margin-top: 8px; padding: 6px 12px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Voir détails
            </button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds
    if (filteredProperties.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      filteredProperties.forEach(property => {
        bounds.extend(property.coordinates);
      });
      mapInstance.current.fitBounds(bounds);
    }
  };

  const createPropertyIcon = (property: any) => {
    const type = property.type?.toLowerCase() || 'apartment';
    const typeIcons = {
      'studio': '🏠',
      'apartment': '🏢', 
      'appartement': '🏢',
      'villa': '🏖️',
      'maison': '🏘️',
      'chambre': '🛏️'
    };
    
    const icon = typeIcons[type] || '🏢';
    const color = property.available ? '#10B981' : '#EF4444';
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="15" cy="15" r="12" fill="${color}" stroke="white" stroke-width="2"/>
          <text x="15" y="20" text-anchor="middle" font-size="10" fill="white">${icon}</text>
          <polygon points="15,27 12,37 18,37" fill="${color}"/>
        </svg>`
      )}`,
      scaledSize: new window.google.maps.Size(30, 40),
      anchor: new window.google.maps.Point(15, 37)
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

    if (maxPrice && maxPrice !== "all") {
      const price = parseInt(maxPrice);
      filtered = filtered.filter(property => property.price <= price);
    }

    if (equipmentFilters.furnished || equipmentFilters.unfurnished || equipmentFilters.parking) {
      filtered = filtered.filter(property => {
        const amenities = property.amenities || [];
        
        if (equipmentFilters.furnished && !property.furnished) return false;
        if (equipmentFilters.unfurnished && property.furnished) return false;
        if (equipmentFilters.parking && !amenities.includes('Parking')) return false;
        
        return true;
      });
    }

    setFilteredProperties(filtered);
  }, [properties, searchQuery, propertyType, maxPrice, equipmentFilters]);

  // Update markers when filtered properties change
  useEffect(() => {
    if (mapInstance.current) {
      updateMapMarkers();
    }
  }, [filteredProperties]);

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
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </SelectContent>
              </Select>
              
              <Select value={maxPrice} onValueChange={setMaxPrice}>
                <SelectTrigger>
                  <SelectValue placeholder="Prix max" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous prix</SelectItem>
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
          <div 
            ref={mapRef}
            className="w-full h-96 lg:h-[600px] bg-muted"
            style={{ minHeight: '500px' }}
          >
            {loading && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Chargement de la carte...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            🗺️ Cliquez sur les marqueurs pour voir les détails des propriétés
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapView;