import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft,
  MapPin, 
  Search,
  Filter,
  Heart,
  Star,
  Home,
  Layers,
  Navigation
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Google Maps type declarations
declare global {
  interface Window {
    google: any;
  }
}

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState("all");
  const [maxPrice, setMaxPrice] = useState("all");
  const [equipmentFilters, setEquipmentFilters] = useState({
    furnished: false,
    unfurnished: false,
    parking: false
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch real properties data
  useEffect(() => {
    fetchProperties();
  }, []);

  // Initialize Google Map
  useEffect(() => {
    const initMapWhenReady = () => {
      if (window.google && mapRef.current && !mapInstance.current) {
        initializeMap();
      } else if (!window.google) {
        // Wait for Google Maps API to load
        setTimeout(initMapWhenReady, 100);
      }
    };
    initMapWhenReady();
  }, []);

  // Update map markers when filtered properties change
  useEffect(() => {
    if (mapInstance.current && filteredProperties.length > 0) {
      updateMapMarkers();
    }
  }, [filteredProperties]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/properties");
      
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      
      const fetchedProperties = await response.json();
      
      // Process properties with map coordinates
      const propertiesWithCoordinates = fetchedProperties.map((property: any) => ({
        ...property,
        coordinates: {
          lat: parseFloat(property.latitude) || (36.8065 + (Math.random() - 0.5) * 0.1),
          lng: parseFloat(property.longitude) || (10.1815 + (Math.random() - 0.5) * 0.1)
        },
        location: property.address,
        price: parseFloat(property.price) || 0,
        rating: 4.5, // Default rating
        reviews: Math.floor(Math.random() * 30) + 5 // Random review count
      }));
      
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

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    // Center map on Tunisia
    const tunisia = { lat: 36.8065, lng: 10.1815 };
    
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      center: tunisia,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    console.log("Map initialized successfully");
  };

  const updateMapMarkers = () => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers for filtered properties
    filteredProperties.forEach((property) => {
      const marker = new window.google.maps.Marker({
        position: property.coordinates,
        map: mapInstance.current,
        title: property.title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
            `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="${property.available ? '#10B981' : '#EF4444'}" stroke="white" stroke-width="3"/>
              <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${property.price}DT</text>
            </svg>`
          ),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        }
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937;">${property.title}</h3>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${property.location}</p>
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #f59e0b; font-size: 16px;">${property.price} TND/mois</p>
            <div style="display: flex; gap: 4px; margin-bottom: 8px;">
              ${property.available ? '<span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 12px;">✅ Disponible</span>' : '<span style="background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 12px;">🚫 Non disponible</span>'}
              ${property.furnished ? '<span style="background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-size: 12px;">🛋️ Meublé</span>' : ''}
            </div>
            <button onclick="window.open('/property/${property.id}', '_blank')" 
                    style="background: #f59e0b; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">
              Voir les détails
            </button>
          </div>
        `
      });

      // Add click listener
      marker.addListener('click', () => {
        // Close other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        
        infoWindow.open(mapInstance.current, marker);
        setSelectedProperty(property);
        
        // Navigate to property details after a short delay
        setTimeout(() => {
          navigate(`/property/${property.id}`);
        }, 500);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (filteredProperties.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      filteredProperties.forEach(property => {
        bounds.extend(property.coordinates);
      });
      mapInstance.current.fitBounds(bounds);
      
      // Don't zoom too close if there's only one property
      if (filteredProperties.length === 1) {
        setTimeout(() => {
          if (mapInstance.current.getZoom() > 15) {
            mapInstance.current.setZoom(15);
          }
        }, 100);
      }
    }
  };

  // Filter properties based on filters
  useEffect(() => {
    let filtered = [...properties];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(property => 
        property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by property type
    if (propertyType && propertyType !== "all") {
      filtered = filtered.filter(property => property.type === propertyType);
    }

    // Filter by max price
    if (maxPrice && maxPrice !== "all") {
      const price = parseInt(maxPrice);
      filtered = filtered.filter(property => parseFloat(property.price) <= price);
    }

    // Filter by equipment
    if (equipmentFilters.furnished || equipmentFilters.unfurnished || equipmentFilters.parking) {
      filtered = filtered.filter(property => {
        const amenities = property.amenities || [];
        
        let matchesFurnishing = true;
        if (equipmentFilters.furnished && equipmentFilters.unfurnished) {
          // Both selected - show all
          matchesFurnishing = true;
        } else if (equipmentFilters.furnished) {
          matchesFurnishing = amenities.includes('Meublé') || amenities.includes('furnished') || property.furnished;
        } else if (equipmentFilters.unfurnished) {
          matchesFurnishing = !amenities.includes('Meublé') && !amenities.includes('furnished') && !property.furnished;
        }

        const hasParking = equipmentFilters.parking 
          ? amenities.includes('Parking') || amenities.includes('parking')
          : true;

        return matchesFurnishing && hasParking;
      });
    }

    setFilteredProperties(filtered);
  }, [properties, searchQuery, propertyType, maxPrice, equipmentFilters]);

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property);
  };

  const handleFavorite = (propertyId: number) => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour ajouter aux favoris.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    toast({
      title: "Ajouté aux favoris",
      description: "Bien ajouté à vos favoris",
    });
  };

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
              {loading ? 'Chargement des propriétés...' : `${filteredProperties.length} propriété${filteredProperties.length > 1 ? 's' : ''} trouvée${filteredProperties.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="glass-card mb-6">
          <CardContent className="p-4">
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
                        id="map-furnished" 
                        checked={equipmentFilters.furnished}
                        onCheckedChange={(checked) => 
                          setEquipmentFilters(prev => ({ ...prev, furnished: checked === true }))
                        }
                      />
                      <label htmlFor="map-furnished" className="text-sm">🛏️ Meublé</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="map-unfurnished" 
                        checked={equipmentFilters.unfurnished}
                        onCheckedChange={(checked) => 
                          setEquipmentFilters(prev => ({ ...prev, unfurnished: checked === true }))
                        }
                      />
                      <label htmlFor="map-unfurnished" className="text-sm">🏠 Non meublé</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="map-parking" 
                        checked={equipmentFilters.parking}
                        onCheckedChange={(checked) => 
                          setEquipmentFilters(prev => ({ ...prev, parking: checked === true }))
                        }
                      />
                      <label htmlFor="map-parking" className="text-sm">🚗 Parking</label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Google Maps Container */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardContent className="p-0">
                <div 
                  ref={mapRef}
                  className="w-full h-96 lg:h-[600px] bg-muted rounded-lg overflow-hidden"
                  style={{ minHeight: '400px' }}
                >
                  {/* Loading/Fallback state */}
                  {!mapInstance.current && (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <div className="text-center text-foreground/60">
                        <Layers className="h-16 w-16 mx-auto mb-4" />
                        <p className="font-medium">Chargement de la carte...</p>
                        <p className="text-sm">{filteredProperties.length} propriétés trouvées</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Details Sidebar */}
          <div className="space-y-6">
            {selectedProperty ? (
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedProperty.title}</h3>
                        <p className="text-muted-foreground text-sm flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {selectedProperty.location}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFavorite(selectedProperty.id)}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-medium">{selectedProperty.rating}</span>
                        <span className="text-muted-foreground text-sm">({selectedProperty.reviews} avis)</span>
                      </div>
                      <Badge variant="outline">{selectedProperty.type}</Badge>
                    </div>

                    <div className="text-2xl font-bold text-primary">
                      {selectedProperty.price} TND/mois
                    </div>

                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => navigate(`/property/${selectedProperty.id}`)}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Voir les détails
                      </Button>
                      <Button variant="outline" className="w-full">
                        Contacter le propriétaire
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Sélectionnez un bien</h3>
                  <p className="text-muted-foreground text-sm">
                    Cliquez sur un marqueur de la carte pour voir les détails du bien
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Properties List */}
            <Card className="glass-card">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Biens disponibles ({properties.length})</h3>
                <div className="space-y-3">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedProperty?.id === property.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handlePropertyClick(property)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{property.title}</p>
                          <p className="text-xs text-muted-foreground">{property.location}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="h-3 w-3 fill-warning text-warning" />
                            <span className="text-xs">{property.rating}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{property.price} TND</p>
                          <Badge variant="outline" className="text-xs">{property.type}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;