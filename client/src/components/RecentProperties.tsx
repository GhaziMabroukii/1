import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  MapPin, 
  Star, 
  Heart,
  Eye
} from "lucide-react";
import { useLocation } from "wouter";

const RecentProperties = () => {
  const [, navigate] = useLocation();

  // Mock recent properties (last 7 days)
  const recentProperties = [
    {
      id: 1,
      title: "Studio moderne près INSAT",
      price: 450,
      location: "Ariana, Raoued",
      rating: 4.8,
      reviews: 24,
      daysAgo: 2,
      image: "/placeholder.svg",
      badge: "🆕"
    },
    {
      id: 2,
      title: "Appartement 2 pièces meublé",
      price: 680,
      location: "Tunis, Manouba",
      rating: 4.5,
      reviews: 18,
      daysAgo: 4,
      image: "/placeholder.svg",
      badge: "🆕"
    },
    {
      id: 3,
      title: "Villa avec jardin",
      price: 1200,
      location: "Sidi Bou Saïd",
      rating: 4.9,
      reviews: 31,
      daysAgo: 6,
      image: "/placeholder.svg",
      badge: "🆕"
    }
  ];

  const handleFavorite = (propertyId: number) => {
    // Handle favorite functionality
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary" />
          <span>Biens récemment ajoutés</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentProperties.map((property) => (
            <div
              key={property.id}
              className="flex items-start space-x-4 p-4 glass-card rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/property/${property.id}`)}
            >
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="text-center">
                  <span className="text-2xl">🏠</span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-sm line-clamp-2">{property.title}</h3>
                    <div className="flex items-center text-muted-foreground text-xs mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{property.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        <span className="text-xs">{property.rating}</span>
                        <span className="text-xs text-muted-foreground">({property.reviews})</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <span className="mr-1">{property.badge}</span>
                        il y a {property.daysAgo} jour{property.daysAgo > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-primary">{property.price} TND</p>
                    <p className="text-xs text-muted-foreground">par mois</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFavorite(property.id);
                  }}
                >
                  <Heart className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/property/${property.id}`);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full mt-4"
          onClick={() => navigate("/search?filter=recent")}
        >
          Voir tous les biens récents
        </Button>
      </CardContent>
    </Card>
  );
};

export default RecentProperties;