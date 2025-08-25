import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Home, 
  Bed, 
  Bath, 
  Maximize,
  Wifi,
  Car,
  Shield,
  User,
  CheckCircle,
  Heart,
  Eye
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

const Compare = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [propertyIds, setPropertyIds] = useState<number[]>([]);

  useEffect(() => {
    // Get property IDs from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const propertiesParam = urlParams.get('properties');
    
    if (propertiesParam) {
      const ids = propertiesParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length >= 2 && ids.length <= 4) {
        setPropertyIds(ids);
      } else {
        toast({
          title: "Erreur",
          description: "Vous devez sélectionner entre 2 et 4 propriétés à comparer",
          variant: "destructive"
        });
        navigate("/favorites");
      }
    } else {
      toast({
        title: "Aucune propriété sélectionnée",
        description: "Veuillez sélectionner des propriétés depuis vos favoris",
        variant: "destructive"
      });
      navigate("/favorites");
    }
  }, [navigate, toast]);

  // Fetch property details for comparison
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['/api/properties', propertyIds],
    queryFn: async () => {
      if (propertyIds.length === 0) return [];
      
      const promises = propertyIds.map(async (id) => {
        const response = await fetch(`/api/properties/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch property ${id}`);
        }
        return response.json();
      });
      
      return Promise.all(promises);
    },
    enabled: propertyIds.length > 0
  });

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi": return <Wifi className="h-4 w-4" />;
      case "parking": return <Car className="h-4 w-4" />;
      case "security": return <Shield className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "studio": return "🏠";
      case "apartment": return "🏢";
      case "villa": return "🏡";
      default: return "🏠";
    }
  };

  const formatPrice = (price: any) => {
    return typeof price === 'string' ? price : `${price}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="lg" text="Chargement de la comparaison..." />
        </div>
      </div>
    );
  }

  if (error || properties.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-6">
              Impossible de charger les propriétés pour la comparaison
            </p>
            <Button onClick={() => navigate("/favorites")} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Retour aux favoris</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center space-x-3">
              <Eye className="h-8 w-8 text-primary" />
              <span>Comparaison des propriétés</span>
            </h1>
            <p className="text-muted-foreground">
              Comparez {properties.length} propriétés côte à côte
            </p>
          </div>
          <Button 
            onClick={() => navigate("/favorites")} 
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour aux favoris</span>
          </Button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map((property, index) => (
            <Card key={property.id} className="glass-card overflow-hidden">
              <CardHeader className="p-0">
                {/* Property Image */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  {property.images && property.images.length > 0 && property.images[0] !== '/placeholder.svg' ? (
                    <img 
                      src={property.images[0]} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Home className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Property Type Badge */}
                  <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800">
                    {getPropertyTypeIcon(property.type)} {property.type}
                  </Badge>
                </div>

                <CardTitle className="p-4 pb-2 text-lg leading-tight">
                  {property.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                {/* Price */}
                <div className="mb-4">
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                    {formatPrice(property.price)} TND/{property.priceType}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 mb-4 p-2 bg-white/50 rounded-lg">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700 flex-1">
                    {property.address}
                  </span>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {property.surface && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Maximize className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-medium">{property.surface}m²</div>
                      <div className="text-xs text-muted-foreground">Surface</div>
                    </div>
                  )}
                  {property.rooms && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-medium">{property.rooms}</div>
                      <div className="text-xs text-muted-foreground">Chambres</div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-medium">{property.bathrooms}</div>
                      <div className="text-xs text-muted-foreground">S.de bains</div>
                    </div>
                  )}
                </div>

                {/* Rating */}
                {property.rating > 0 ? (
                  <div className="flex items-center gap-2 mb-4 bg-yellow-50 p-2 rounded-lg">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-700">
                      {property.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-yellow-600">
                      ({property.reviews || 0} avis)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-lg">
                    <Star className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Nouveau bien</span>
                  </div>
                )}

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2">Équipements</h4>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.slice(0, 6).map((amenity: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1 bg-white/70 px-2 py-1 rounded-full border text-xs">
                          {getAmenityIcon(amenity)}
                          <span>{amenity}</span>
                        </div>
                      ))}
                      {property.amenities.length > 6 && (
                        <Badge variant="outline" className="text-xs bg-white/70">
                          +{property.amenities.length - 6}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Pricing Details */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold mb-2">Tarification</h4>
                  <div className="space-y-1 text-sm">
                    {property.deposit && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Caution:</span>
                        <span className="font-medium">{property.deposit} TND</span>
                      </div>
                    )}
                    {property.fees && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frais:</span>
                        <span className="font-medium">{property.fees} TND</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Charges incluses:</span>
                      <span className="font-medium">{property.utilitiesIncluded ? 'Oui' : 'Non'}</span>
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-600">{property.owner || 'Propriétaire'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Vérifié</span>
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full mt-4" 
                  onClick={() => navigate(`/property/${property.id}`)}
                >
                  Voir les détails
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Résumé de la comparaison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.min(...properties.map(p => parseFloat(formatPrice(p.price)) || 0))} TND
              </div>
              <div className="text-sm text-muted-foreground">Prix le plus bas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.max(...properties.map(p => p.surface || 0))} m²
              </div>
              <div className="text-sm text-muted-foreground">Plus grande surface</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...properties.map(p => p.rating || 0)).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Meilleure note</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;