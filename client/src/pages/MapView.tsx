import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  MapPin, 
  Search,
  Filter,
  Heart,
  Star,
  Home,
  Layers
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const MapView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Mock properties data with coordinates
  const properties = [
    {
      id: 1,
      title: "Studio moderne près INSAT",
      price: 450,
      location: "Ariana, Raoued",
      coordinates: { lat: 36.8622, lng: 10.1958 },
      type: "studio",
      rating: 4.8,
      reviews: 24
    },
    {
      id: 2,
      title: "Appartement 2 pièces",
      price: 680,
      location: "Tunis, Manouba",
      coordinates: { lat: 36.8083, lng: 10.0963 },
      type: "apartment",
      rating: 4.5,
      reviews: 18
    },
    {
      id: 3,
      title: "Villa avec jardin",
      price: 1200,
      location: "Sidi Bou Saïd",
      coordinates: { lat: 36.8704, lng: 10.3472 },
      type: "villa",
      rating: 4.9,
      reviews: 31
    }
  ];

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
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de bien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="apartment">Appartement</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="vacation">Maison de vacances</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Prix max" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">Jusqu'à 500 TND</SelectItem>
                    <SelectItem value="1000">Jusqu'à 1000 TND</SelectItem>
                    <SelectItem value="1500">Jusqu'à 1500 TND</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Surface" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">Jusqu'à 50m²</SelectItem>
                    <SelectItem value="100">Jusqu'à 100m²</SelectItem>
                    <SelectItem value="150">Plus de 150m²</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="relative h-96 lg:h-[600px] bg-muted rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20"></div>
                  
                  {/* Map Markers */}
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{
                        left: `${30 + (property.id * 25)}%`,
                        top: `${20 + (property.id * 15)}%`
                      }}
                      onClick={() => handlePropertyClick(property)}
                    >
                      <div className="relative">
                        <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg border-2 border-background">
                          <div className="text-sm font-medium">{property.price} TND</div>
                          <div className="text-xs">{property.type}</div>
                        </div>
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Map Center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-foreground/60">
                      <Layers className="h-16 w-16 mx-auto mb-4" />
                      <p className="font-medium">Carte Interactive de Tunis</p>
                      <p className="text-sm">Cliquez sur les marqueurs pour voir les détails</p>
                    </div>
                  </div>
                  
                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <Button size="sm" variant="secondary">+</Button>
                    <Button size="sm" variant="secondary">-</Button>
                  </div>
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