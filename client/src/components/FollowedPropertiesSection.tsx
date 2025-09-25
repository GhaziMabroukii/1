import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useLocation } from 'wouter';
import { 
  Home, 
  MapPin, 
  Euro, 
  Calendar, 
  User,
  Heart,
  AlertCircle,
  ExternalLink 
} from 'lucide-react';

interface FollowedPropertiesSectionProps {
  userId: number;
}

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  createdAt: string;
  owner: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export const FollowedPropertiesSection: React.FC<FollowedPropertiesSectionProps> = ({ userId }) => {
  const [, navigate] = useLocation();

  // Fetch properties from followed users
  const { data: followedProperties, isLoading, error } = useQuery({
    queryKey: ['/api/social/following-properties'],
    queryFn: async () => {
      const response = await fetch('/api/social/following-properties', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch properties from followed users');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 60000, // Cache for 1 minute
  });

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Propriétés de vos contacts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner className="h-6 w-6" />
          <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Propriétés de vos contacts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">Erreur lors du chargement</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span>Propriétés de vos contacts</span>
          </div>
          <Badge variant="secondary" data-testid="followed-properties-count">
            {followedProperties?.length || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!followedProperties || followedProperties.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-medium text-muted-foreground mb-2">
              Aucune propriété disponible
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Les propriétaires que vous suivez n'ont pas encore publié de propriétés, 
              ou vous ne suivez personne actuellement.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/properties')}
              data-testid="button-browse-properties"
            >
              <Home className="h-4 w-4 mr-2" />
              Parcourir les propriétés
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {followedProperties.slice(0, 3).map((property: Property) => (
              <div 
                key={property.id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800/50"
                data-testid={`property-card-${property.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm line-clamp-1 mb-1">
                      {property.title}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                      <User className="h-3 w-3" />
                      <span>{property.owner.firstName} {property.owner.lastName}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {property.type}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="line-clamp-1">{property.location}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Euro className="h-3 w-3 mr-1" />
                      <span className="font-medium text-primary">
                        {property.price} DT/mois
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{new Date(property.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground line-clamp-2 flex-1 mr-3">
                    {property.description}
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/properties/${property.id}`)}
                    data-testid={`button-view-property-${property.id}`}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Voir
                  </Button>
                </div>
              </div>
            ))}
            
            {followedProperties.length > 3 && (
              <div className="text-center pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/properties?filter=following')}
                  data-testid="button-view-all-followed"
                >
                  Voir toutes les propriétés ({followedProperties.length})
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowedPropertiesSection;