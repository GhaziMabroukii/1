import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Star, 
  MapPin, 
  Home, 
  Trash2,
  Search,
  Scale,
  Eye,
  User,
  CheckCircle,
  Bed,
  Bath
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Favorites = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);
  
  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    try {
      const userData = localStorage.getItem("userData");
      if (userData) {
        const user = JSON.parse(userData);
        return user.id;
      }
    } catch (error) {
      console.error("Error getting user ID:", error);
    }
    return null;
  };
  
  const currentUserId = getCurrentUserId();


  // Fetch user favorites from API
  const { data: favorites = [], isLoading, error, refetch } = useQuery({
    queryKey: [`/api/users/${currentUserId}/favorites`],
    queryFn: async () => {
      if (!currentUserId) throw new Error('User not authenticated');
      const response = await fetch(`/api/users/${currentUserId}/favorites`);
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      return response.json();
    },
    enabled: !!currentUserId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
  });
  
  useEffect(() => {
    // Check authentication
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      if (!currentUserId) throw new Error('User not authenticated');
      const response = await fetch(`/api/users/${currentUserId}/favorites/${propertyId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to remove from favorites');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch favorites data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/favorites`] });
      
      toast({
        title: "Retiré des favoris",
        description: "Le bien a été retiré de vos favoris"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de retirer le bien des favoris",
        variant: "destructive"
      });
    }
  });
  
  const removeFavorite = (propertyId: number) => {
    removeFromFavoritesMutation.mutate(propertyId);
  };

  const getAmenityIcon = (amenity: string): string => {
    switch (amenity) {
      case "wifi": return "📶";
      case "parking": return "🚗";
      case "furnished": return "🛋️";
      case "garden": return "🌿";
      case "security": return "🔒";
      default: return "✓";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center space-x-3">
              <Heart className="h-8 w-8 text-destructive" />
              <span>Mes Favoris</span>
            </h1>
            <p className="text-muted-foreground">
              {favorites.length} bien(s) sauvegardé(s)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {favorites.length > 1 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedForComparison([]);
                }}
                className="flex items-center space-x-2"
              >
                <Scale className="h-4 w-4" />
                <span>{compareMode ? 'Annuler' : 'Comparer'}</span>
              </Button>
            )}
            {compareMode && selectedForComparison.length >= 2 && (
              <Button 
                onClick={() => navigate(`/compare?properties=${selectedForComparison.join(',')}`)}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Voir la comparaison</span>
              </Button>
            )}
            <Button onClick={() => navigate("/search")} className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Continuer la recherche</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" text="Chargement des favoris..." />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-6">
              Impossible de charger vos favoris
            </p>
            <Button onClick={() => refetch()} className="flex items-center space-x-2">
              <span>Réessayer</span>
            </Button>
          </div>
        ) : favorites.length > 0 ? (
          <>
            {compareMode && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Mode Comparaison</h3>
                <p className="text-blue-700 text-sm">
                  Sélectionnez 2 à 4 propriétés à comparer. {selectedForComparison.length} sélectionnée(s).
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property) => (
              <Card 
                key={property.id} 
                className={`glass-card cursor-pointer hover:scale-105 transition-all ${
                  compareMode 
                    ? selectedForComparison.includes(property.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50/50' 
                      : 'hover:ring-2 hover:ring-blue-300'
                    : ''
                }`}
                onClick={() => {
                  if (compareMode) {
                    if (selectedForComparison.includes(property.id)) {
                      setSelectedForComparison(prev => prev.filter(id => id !== property.id));
                    } else if (selectedForComparison.length < 4) {
                      setSelectedForComparison(prev => [...prev, property.id]);
                    } else {
                      toast({
                        title: "Limite atteinte",
                        description: "Vous ne pouvez comparer que 4 propriétés maximum",
                        variant: "destructive"
                      });
                    }
                  } else {
                    navigate(`/property/${property.id}`);
                  }
                }}
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
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
                    
                    {/* Remove from favorites button */}
                    {!compareMode && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm hover:bg-destructive/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFavorite(property.id);
                        }}
                        disabled={removeFromFavoritesMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                    
                    {/* Compare mode selection indicator */}
                    {compareMode && (
                      <div className="absolute top-2 right-2">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedForComparison.includes(property.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-white/20 border-white backdrop-blur-sm'
                        }`}>
                          {selectedForComparison.includes(property.id) && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Badges */}
                    {!property.available && (
                      <Badge className="absolute bottom-2 left-2" variant="destructive">
                        Non disponible
                      </Badge>
                    )}
                    {property.isStudentFriendly && (
                      <Badge className="absolute top-2 left-2" variant="default">
                        🎓 Étudiant
                      </Badge>
                    )}
                    {property.isFamilyFriendly && (
                      <Badge className="absolute top-2 left-2" variant="default">
                        👨‍👩‍👧‍👦 Famille
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                    <p className="text-primary font-bold text-xl mb-2">
                      {property.price} TND/{property.priceType}
                    </p>
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{property.location}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <span className="text-accent">📍 {property.distance}</span>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {property.rating > 0 ? (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            <span className="text-sm font-medium">{property.rating}</span>
                            <span className="text-sm text-muted-foreground">
                              ({property.reviews || 0} avis)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Nouveau</span>
                          </div>
                        )}
                        
                        {/* Property details */}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                        </div>
                      </div>
                    </div>
                    
                    {/* Owner information */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
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

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {property.amenities.slice(0, 3).map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {getAmenityIcon(amenity)}
                        </Badge>
                      ))}
                      {property.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{property.amenities.length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      Ajouté le {new Date(property.addedToFavorites).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun favori pour le moment</h3>
            <p className="text-muted-foreground mb-6">
              Explorez nos biens et ajoutez vos préférés à cette liste
            </p>
            <Button onClick={() => navigate("/search")} className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Découvrir des biens</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;