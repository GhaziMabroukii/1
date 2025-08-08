import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Favorites = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Mock favorites data
  const mockFavorites = [
    {
      id: 1,
      title: "Studio moderne près INSAT",
      price: 450,
      priceType: "mois",
      location: "Ariana, Raoued",
      distance: "200m de l'INSAT",
      rating: 4.8,
      reviews: 24,
      type: "studio",
      amenities: ["wifi", "furnished", "parking"],
      images: ["/placeholder.svg"],
      isStudentFriendly: true,
      owner: "Ahmed Karim",
      available: true,
      addedToFavorites: "2024-01-15"
    },
    {
      id: 2,
      title: "Appartement 2 pièces famille",
      price: 680,
      priceType: "mois",
      location: "Tunis, Bardo",
      distance: "5 min de l'école primaire",
      rating: 4.6,
      reviews: 18,
      type: "apartment",
      amenities: ["wifi", "garden", "security"],
      images: ["/placeholder.svg"],
      isFamilyFriendly: true,
      owner: "Fatma Ben Ali",
      available: true,
      addedToFavorites: "2024-01-12"
    },
    {
      id: 3,
      title: "Villa avec jardin sécurisé",
      price: 1200,
      priceType: "mois",
      location: "Sidi Bou Saïd",
      distance: "10 min du centre",
      rating: 4.9,
      reviews: 32,
      type: "villa",
      amenities: ["wifi", "garden", "parking", "security"],
      images: ["/placeholder.svg"],
      isFamilyFriendly: true,
      owner: "Mohamed Trabelsi",
      available: true,
      addedToFavorites: "2024-01-10"
    }
  ];

  useEffect(() => {
    // Check authentication
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }

    // Load favorites from localStorage or use mock data
    const savedFavorites = localStorage.getItem("userFavorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    } else {
      setFavorites(mockFavorites);
      localStorage.setItem("userFavorites", JSON.stringify(mockFavorites));
    }
  }, [navigate]);

  const removeFavorite = (propertyId: number) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== propertyId);
    setFavorites(updatedFavorites);
    localStorage.setItem("userFavorites", JSON.stringify(updatedFavorites));
    
    toast({
      title: "Retiré des favoris",
      description: "Le bien a été retiré de vos favoris",
    });
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
          <Button onClick={() => navigate("/search")} className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Continuer la recherche</span>
          </Button>
        </div>

        {/* Favorites Grid */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property) => (
              <Card 
                key={property.id} 
                className="glass-card cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate(`/property/${property.id}`)}
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Home className="h-12 w-12 text-muted-foreground" />
                    </div>
                    
                    {/* Remove from favorites button */}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm hover:bg-destructive/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(property.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>

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
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="text-sm font-medium">{property.rating}</span>
                        <span className="text-sm text-muted-foreground">
                          ({property.reviews} avis)
                        </span>
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