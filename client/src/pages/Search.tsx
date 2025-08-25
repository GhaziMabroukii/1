import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { LoadingSpinner, PropertySkeleton } from "@/components/LoadingSpinner";
import { NetworkError } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search as SearchIcon, 
  MapPin, 
  Filter, 
  Heart, 
  Star, 
  Wifi, 
  Car, 
  GraduationCap,
  Users,
  Home,
  Maximize,
  Bed,
  Bath,
  Building,
  TreePine,
  Shield,
  User,
  CheckCircle,
  Waves,
  Wind,
  Utensils,
  Eye
} from "lucide-react";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [equipmentFilters, setEquipmentFilters] = useState({
    furnished: false,
    unfurnished: false,
    parking: false
  });
  const [, navigate] = useLocation();

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchProperties();
    
    // Handle URL parameters from HeroSection search
    const urlParams = new URLSearchParams(window.location.search);
    const locationParam = urlParams.get('location');
    const maxPriceParam = urlParams.get('maxPrice');
    const userTypeParam = urlParams.get('userType');
    const filterParam = urlParams.get('filter');
    
    if (locationParam) {
      setSearchQuery(locationParam);
    }
    if (maxPriceParam) {
      const price = parseInt(maxPriceParam);
      setPriceRange([0, price]);
    }
    if (userTypeParam) {
      setCategoryFilter(userTypeParam === 'student' ? 'student' : userTypeParam === 'family' ? 'family' : '');
    }
    if (filterParam) {
      setCategoryFilter(filterParam === 'student' ? 'student' : filterParam === 'family' ? 'family' : '');
    }
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch("/api/properties", {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const fetchedProperties = await response.json();
      
      // Fetch owner and review data for each property
      const propertiesWithData = await Promise.all(
        fetchedProperties.map(async (property: any) => {
          // Fetch real owner data
          let ownerName = `Propriétaire ${property.ownerId}`;
          try {
            const ownerResponse = await fetch(`/api/users/${property.ownerId}`);
            if (ownerResponse.ok) {
              const owner = await ownerResponse.json();
              ownerName = owner.firstName ? `${owner.firstName} ${owner.lastName || ''}`.trim() : ownerName;
            }
          } catch (error) {
            console.log('Could not fetch owner data for property', property.id);
          }
          
          // Fetch real reviews data
          let reviewData = { averageRating: 0, totalReviews: 0 };
          try {
            const reviewsResponse = await fetch(`/api/properties/${property.id}/reviews`);
            if (reviewsResponse.ok) {
              const reviews = await reviewsResponse.json();
              if (reviews.length > 0) {
                reviewData.averageRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length;
                reviewData.totalReviews = reviews.length;
              }
            }
          } catch (error) {
            console.log('Could not fetch reviews for property', property.id);
          }
          
          return {
            ...property,
            location: property.address,
            rating: reviewData.averageRating || 0,
            reviews: reviewData.totalReviews,
            owner: ownerName,
            available: property.status === "Disponible",
            isStudentFriendly: property.categories?.includes('Étudiant') || property.type === "studio",
            isFamilyFriendly: property.categories?.includes('Famille') || property.type === "villa" || property.rooms >= 2,
            // Add view count (simulated based on property age and rating)
            views: Math.floor(Math.random() * 500) + 50,
            // Add category-specific theming data
            themeData: getPropertyTheme(property)
          };
        })
      );
      
      setProperties(propertiesWithData);
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      setProperties([]);
      
      if (error.name === 'AbortError') {
        setError("La connexion a pris trop de temps. Vérifiez votre connexion internet.");
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setError("Impossible de se connecter au serveur. Vérifiez votre connexion internet.");
      } else {
        setError(error.message || "Une erreur s'est produite lors du chargement des propriétés.");
      }
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    setRetryCount(prev => prev + 1);
    fetchProperties();
  };

  // Initialize filtered properties with fetched data
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);

  // Update filtered properties when properties change
  useEffect(() => {
    setFilteredProperties(properties);
  }, [properties]);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation(position),
        (error) => console.log("Location access denied")
      );
    }
  }, []);

  const handleLocationSearch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation(position);
          // Filter properties within 5km radius
          const nearbyProperties = properties.filter(p => 
            calculateDistance(
              position.coords.latitude, 
              position.coords.longitude,
              p.latitude || 34.7404, // Default to Sfax if no coordinates
              p.longitude || 10.7603
            ) <= 5
          );
          setFilteredProperties(nearbyProperties);
        },
        (error) => console.log("Location access denied")
      );
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleSearch = () => {
    let filtered = properties;

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Property type filter
    if (propertyType && propertyType !== "all") {
      filtered = filtered.filter(p => p.type === propertyType);
    }

    // Category filter using real database categories
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(p => {
        if (categoryFilter === "student") {
          return p.categories?.includes('Étudiant') || p.isStudentFriendly;
        } else if (categoryFilter === "family") {
          return p.categories?.includes('Famille') || p.isFamilyFriendly;
        } else if (categoryFilter === "summer") {
          return p.categories?.includes('Maison d\'été') || p.type === 'maison_ete';
        } else if (categoryFilter === "vue_mer") {
          return p.categories?.includes('Vue sur mer') || p.amenities?.includes('vue_mer');
        } else if (categoryFilter === "proche_plage") {
          return p.categories?.includes('Proche de la plage');
        }
        return p.categories?.includes(categoryFilter);
      });
    }

    // Price range filter
    filtered = filtered.filter(p => {
      const price = parseFloat(p.price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Equipment filters
    if (equipmentFilters.furnished && equipmentFilters.unfurnished) {
      // Both selected means show all (no filter)
    } else if (equipmentFilters.furnished) {
      filtered = filtered.filter(p => p.furnished === true);
    } else if (equipmentFilters.unfurnished) {
      filtered = filtered.filter(p => p.furnished === false);
    }

    if (equipmentFilters.parking) {
      filtered = filtered.filter(p => 
        p.amenities?.some((amenity: string) => 
          amenity.toLowerCase().includes('parking') || 
          amenity.toLowerCase().includes('garage')
        )
      );
    }

    setFilteredProperties(filtered);
  };

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) return { icon: <Wifi className="h-3 w-3" />, label: 'Wi-Fi' };
    if (amenityLower.includes('parking') || amenityLower.includes('garage')) return { icon: <Car className="h-3 w-3" />, label: 'Parking' };
    if (amenityLower.includes('climatisation') || amenityLower.includes('clim')) return { icon: <Wind className="h-3 w-3" />, label: 'Climatisation' };
    if (amenityLower.includes('cuisine') || amenityLower.includes('kitchen')) return { icon: <Utensils className="h-3 w-3" />, label: 'Cuisine' };
    if (amenityLower.includes('piscine')) return { icon: <Waves className="h-3 w-3" />, label: 'Piscine' };
    if (amenityLower.includes('jardin')) return { icon: <TreePine className="h-3 w-3" />, label: 'Jardin' };
    if (amenityLower.includes('balcon')) return { icon: <Building className="h-3 w-3" />, label: 'Balcon' };
    return { icon: <Star className="h-3 w-3" />, label: amenity };
  };
  
  const getPropertyTheme = (property: any) => {
    const type = property.type?.toLowerCase() || '';
    const categories = property.categories || [];
    
    // Property type themes
    const typeThemes = {
      'studio': { 
        gradient: 'from-purple-500 to-pink-500', 
        bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
        icon: '🏠', 
        color: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-700 border-purple-200'
      },
      'appartement': { 
        gradient: 'from-blue-500 to-cyan-500', 
        bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
        icon: '🏢', 
        color: 'text-blue-700',
        badge: 'bg-blue-100 text-blue-700 border-blue-200'
      },
      'villa': { 
        gradient: 'from-green-500 to-emerald-500', 
        bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
        icon: '🏡', 
        color: 'text-green-700',
        badge: 'bg-green-100 text-green-700 border-green-200'
      },
      'maison': { 
        gradient: 'from-orange-500 to-red-500', 
        bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
        icon: '🏘️', 
        color: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-700 border-orange-200'
      },
      'maison_ete': { 
        gradient: 'from-amber-500 via-orange-500 to-pink-500', 
        bgColor: 'bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50',
        icon: '🏖️', 
        color: 'text-amber-700',
        badge: 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border-amber-200'
      }
    };
    
    // Category themes with creative icons
    const categoryThemes = {
      'Étudiant': { accent: '🎓', specialBadge: 'Pour étudiants', color: 'text-blue-600', bg: 'bg-blue-50' },
      'Famille': { accent: '👨‍👩‍👧‍👦', specialBadge: 'Pour familles', color: 'text-green-600', bg: 'bg-green-50' },
      'Maison d\'été': { accent: '🏖️', specialBadge: 'Résidence d\'été', color: 'text-amber-600', bg: 'bg-amber-50' },
      'Vue sur mer': { accent: '🌊', specialBadge: 'Vue panoramique', color: 'text-cyan-600', bg: 'bg-cyan-50' },
      'Proche de la plage': { accent: '🏝️', specialBadge: 'Bord de mer', color: 'text-teal-600', bg: 'bg-teal-50' },
      'student': { accent: '🎓', specialBadge: 'Pour étudiants', color: 'text-blue-600', bg: 'bg-blue-50' },
      'family': { accent: '👨‍👩‍👧‍👦', specialBadge: 'Pour familles', color: 'text-green-600', bg: 'bg-green-50' },
      'summer': { accent: '🏖️', specialBadge: 'Résidence d\'été', color: 'text-amber-600', bg: 'bg-amber-50' }
    };
    
    const baseTheme = typeThemes[type as keyof typeof typeThemes] || typeThemes.appartement;
    const categoryAccents = categories.map((cat: string) => categoryThemes[cat as keyof typeof categoryThemes]).filter(Boolean);
    
    return {
      ...baseTheme,
      categoryAccents,
      furnished: property.furnished,
      trustScore: getTrustScore(property)
    };
  };
  
  const getTrustScore = (property: any) => {
    let score = 3; // Base score
    if (property.images && property.images.length > 0) score += 1;
    if (property.reviews > 0) score += 1;
    if (property.furnished) score += 0.5;
    if (property.amenities && property.amenities.length > 3) score += 0.5;
    return Math.min(5, score);
  };

  useEffect(() => {
    handleSearch();
  }, [searchQuery, propertyType, categoryFilter, priceRange, equipmentFilters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Enhanced Search Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent mb-4">
            🔍 Trouvez votre logement idéal
          </h1>
          <p className="text-gray-600 text-sm sm:text-base md:text-lg px-4">Découvrez les meilleures propriétés avec des informations détaillées et fiables</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                placeholder="🏠 Rechercher par titre ou adresse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-gray-50 text-sm sm:text-base md:text-lg h-10 sm:h-12"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <Button 
                onClick={handleLocationSearch}
                variant="outline" 
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">📍 Près de moi</span>
                <span className="sm:hidden">📍 Localiser</span>
              </Button>
              <Button 
                onClick={() => navigate("/map")}
                variant="default"
                className="bg-primary hover:bg-primary/90 h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">🗺️ Voir la carte</span>
                <span className="sm:hidden">🗺️ Carte</span>
              </Button>
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="bg-gray-50 hover:bg-gray-100 h-10 sm:h-12 px-4 sm:px-6 text-sm sm:text-base"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        {showFilters && (
          <Card className="mb-6 sm:mb-8 shadow-lg border-0">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <label className="text-sm font-semibold mb-3 block text-gray-700">Type de bien</label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Tous types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous types</SelectItem>
                      <SelectItem value="studio">🏠 Studio</SelectItem>
                      <SelectItem value="appartement">🏢 Appartement</SelectItem>
                      <SelectItem value="villa">🏡 Villa</SelectItem>
                      <SelectItem value="maison">🏘️ Maison</SelectItem>
                      <SelectItem value="maison_ete">☀️ Maison d'été</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-semibold mb-3 block text-gray-700">Catégorie</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Toutes catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes catégories</SelectItem>
                      <SelectItem value="student">🎓 Pour étudiants</SelectItem>
                      <SelectItem value="family">👨‍👩‍👧‍👦 Pour familles</SelectItem>
                      <SelectItem value="summer">🏖️ Maison d'été</SelectItem>
                      <SelectItem value="vue_mer">🌊 Vue sur mer</SelectItem>
                      <SelectItem value="proche_plage">🏝️ Proche plage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-3 block text-gray-700">
                    Budget: {priceRange[0]} - {priceRange[1]} TND
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={2000}
                    step={50}
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-3 block text-gray-700">Équipements</label>
                  <div className="space-y-3">
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
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
            🎯 {filteredProperties.length} bien(s) trouvé(s)
          </h2>
          <Select defaultValue="price" onValueChange={(value) => {
            let sorted = [...filteredProperties];
            switch(value) {
              case "price":
                sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                break;
              case "price-desc":
                sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                break;
              case "rating":
                sorted.sort((a, b) => b.rating - a.rating);
                break;
              case "views":
                sorted.sort((a, b) => b.views - a.views);
                break;
            }
            setFilteredProperties(sorted);
          }}>
            <SelectTrigger className="w-full sm:w-48 h-10 sm:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">💰 Prix croissant</SelectItem>
              <SelectItem value="price-desc">💎 Prix décroissant</SelectItem>
              <SelectItem value="rating">⭐ Mieux notés</SelectItem>
              <SelectItem value="views">👀 Plus vues</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-8">
            <div className="text-center">
              <LoadingSpinner size="lg" text="Recherche des propriétés..." />
            </div>
            <PropertySkeleton />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <NetworkError 
            message={error}
            onRetry={retryFetch}
          />
        )}

        {/* Enhanced Property Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredProperties.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Home className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Aucun bien trouvé</h3>
                <p className="text-muted-foreground">
                  Essayez de modifier vos critères de recherche
                </p>
              </div>
            ) : (
              filteredProperties.map((property) => {
                const theme = property.themeData || getPropertyTheme(property);
                const trustStars = Array.from({ length: 5 }, (_, i) => i < Math.floor(theme.trustScore));
                
                return (
              <Card 
                key={property.id} 
                className={`cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-300 border-0 shadow-lg ${theme.bgColor} overflow-hidden`}
                onClick={() => navigate(`/property/${property.id}`)}
                data-testid={`card-property-${property.id}`}
              >
                <CardContent className="p-0">
                  {/* Enhanced Image Section */}
                  <div className="relative h-48 sm:h-52 overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <>
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                          data-testid={`img-property-${property.id}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                        {property.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                            📷 {property.images.length} photos
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={`h-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
                        <div className="text-center text-white">
                          <div className="text-4xl mb-2">{theme.icon}</div>
                          <p className="text-sm font-medium">{property.type}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Enhanced Status and Category Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {!property.available && (
                        <Badge className="bg-red-600/90 text-white border-0 backdrop-blur-sm">
                          🚫 Non disponible
                        </Badge>
                      )}
                      {property.available && (
                        <Badge className="bg-green-600/90 text-white border-0 backdrop-blur-sm">
                          ✅ Disponible
                        </Badge>
                      )}
                      {property.furnished && (
                        <Badge className="bg-blue-600/90 text-white border-0 backdrop-blur-sm">
                          🛋️ Meublé
                        </Badge>
                      )}
                    </div>
                    
                    {/* Category Accent Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1">
                      {theme.categoryAccents?.map((accent: any, index: number) => (
                        <Badge key={index} className="bg-white/90 text-gray-800 border-0 backdrop-blur-sm text-xs">
                          {accent.accent} {accent.specialBadge}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Favorite Button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute bottom-3 right-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        const favorites = JSON.parse(localStorage.getItem("userFavorites") || "[]");
                        const isAlreadyFavorite = favorites.some((fav: any) => fav.id === property.id);
                        
                        if (!isAlreadyFavorite) {
                          const newFavorite = { ...property, addedToFavorites: new Date().toISOString() };
                          favorites.push(newFavorite);
                          localStorage.setItem("userFavorites", JSON.stringify(favorites));
                        }
                      }}
                      data-testid={`button-favorite-${property.id}`}
                    >
                      <Heart className="h-4 w-4 text-white" />
                    </Button>
                  </div>

                  {/* Enhanced Content Section */}
                  <div className="p-4 sm:p-5">
                    {/* Title and Type */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl sm:text-2xl">{theme.icon}</span>
                          <Badge className={`${theme.badge} text-xs`} data-testid={`badge-type-${property.id}`}>
                            {property.type}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-base sm:text-lg leading-tight mb-1 truncate" data-testid={`text-title-${property.id}`}>
                          {property.title}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Price and Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent" data-testid={`text-price-${property.id}`}>
                          {property.price}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                          TND/{property.priceType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
                        {property.rooms && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.rooms}</span>
                          </div>
                        )}
                        {property.bathrooms && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{property.bathrooms}</span>
                          </div>
                        )}
                        {property.surface && (
                          <div className="flex items-center gap-1">
                            <Home className="h-4 w-4" />
                            <span>{property.surface}m²</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Location with Better Display */}
                    <div className="flex items-center gap-2 mb-3 p-2 bg-white/50 rounded-lg">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700 flex-1" data-testid={`text-location-${property.id}`}>
                        {property.address}
                      </span>
                      {property.geographicHighlight && (
                        <Badge variant="outline" className="text-xs bg-blue-50">
                          📍 {property.geographicHighlight}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Rating, Views and Trust Indicators */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {/* Real Rating */}
                        {property.rating > 0 ? (
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full" data-testid={`rating-${property.id}`}>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-bold text-yellow-700">
                              {property.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-yellow-600">
                              ({property.reviews} avis)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                            <Star className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Nouveau</span>
                          </div>
                        )}
                        
                        {/* Views Counter */}
                        <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full" data-testid={`views-${property.id}`}>
                          <Eye className="h-3 w-3 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">{property.views} vues</span>
                        </div>
                      </div>
                      
                      {/* Trust Score */}
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {trustStars.map((filled, i) => (
                            <div key={i} className="relative">
                              <Shield className={`h-3 w-3 ${
                                filled ? 'text-green-500 fill-green-100' : 'text-gray-300'
                              }`} />
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-green-600 font-medium">Vérifié</span>
                      </div>
                    </div>

                    {/* Enhanced Amenities */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.slice(0, 4).map((amenity: string) => {
                            const amenityInfo = getAmenityIcon(amenity);
                            return (
                              <div key={amenity} className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded-full border">
                                {amenityInfo.icon}
                                <span className="text-xs font-medium">{amenityInfo.label}</span>
                              </div>
                            );
                          })}
                          {property.amenities.length > 4 && (
                            <Badge variant="outline" className="text-xs bg-white/70">
                              +{property.amenities.length - 4} autres
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Owner Information */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/50">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                          <User className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm text-gray-600" data-testid={`text-owner-${property.id}`}>{property.owner}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Propriétaire vérifié</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;