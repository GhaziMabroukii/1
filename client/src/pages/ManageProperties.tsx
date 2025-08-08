import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Home, 
  Plus,
  Eye,
  MessageSquare,
  Edit,
  Trash2,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ManageProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Mock properties data
  const mockProperties = [
    {
      id: 1,
      title: "Villa familiale avec jardin",
      type: "villa",
      price: 1200,
      priceType: "mois",
      address: "Sidi Bou Saïd",
      status: "Occupé",
      tenant: "Famille Gharbi",
      contractEnd: "2024-12-31",
      views: 234,
      messages: 8,
      revenue: 14400,
      createdAt: "2023-06-15",
      images: ["/placeholder.svg"]
    },
    {
      id: 2,
      title: "Studio étudiant meublé",
      type: "studio",
      price: 480,
      priceType: "mois",
      address: "Tunis, Manouba",
      status: "Disponible",
      tenant: null,
      contractEnd: null,
      views: 156,
      messages: 12,
      revenue: 5760,
      createdAt: "2023-08-20",
      images: ["/placeholder.svg"]
    },
    {
      id: 3,
      title: "Appartement 2 pièces moderne",
      type: "apartment",
      price: 650,
      priceType: "mois",
      address: "Tunis, Bardo",
      status: "En rénovation",
      tenant: null,
      contractEnd: null,
      views: 89,
      messages: 3,
      revenue: 0,
      createdAt: "2024-01-10",
      images: ["/placeholder.svg"]
    }
  ];

  useEffect(() => {
    // Check if user is authenticated and is an owner
    const isAuth = localStorage.getItem("isAuthenticated");
    const userType = localStorage.getItem("userType");
    
    if (!isAuth) {
      navigate("/login");
      return;
    }
    
    if (userType !== "owner") {
      toast({
        title: "Accès refusé",
        description: "Seuls les propriétaires peuvent accéder à cette page",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    // Fetch properties from API
    fetchOwnerProperties();
  }, [navigate, toast]);

  const fetchOwnerProperties = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const response = await fetch(`/api/properties?ownerId=${currentUser.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      
      const fetchedProperties = await response.json();
      setProperties(fetchedProperties.map((property: any) => ({
        ...property,
        revenue: 0, // Will be calculated from contracts later
        views: Math.floor(Math.random() * 300), // Mock for now
        messages: Math.floor(Math.random() * 20), // Mock for now
        tenant: null, // Will be populated from active contracts
        contractEnd: null
      })));
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos biens",
        variant: "destructive",
      });
      // Fallback to empty array instead of mock data
      setProperties([]);
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Occupé": return "default";
      case "Disponible": return "success";
      case "En rénovation": return "warning";
      case "En attente": return "secondary";
      default: return "outline";
    }
  };

  const generateContract = (propertyId: number) => {
    toast({
      title: "Contrat généré",
      description: "Le contrat numérique a été créé et envoyé au locataire",
    });
  };

  const deleteProperty = (propertyId: number) => {
    const updatedProperties = properties.filter(p => p.id !== propertyId);
    setProperties(updatedProperties);
    localStorage.setItem("userProperties", JSON.stringify(updatedProperties));
    
    toast({
      title: "Bien supprimé",
      description: "Le bien a été retiré de votre portfolio",
    });
  };

  const handleContractAction = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property);
    setShowContractDialog(true);
  };

  const navigateToContracts = () => {
    navigate("/contracts");
  };

  const createContractForProperty = () => {
    if (selectedProperty) {
      navigate(`/create-contract?propertyId=${selectedProperty.id}`);
    }
    setShowContractDialog(false);
  };

  // Calculate stats
  const stats = {
    totalProperties: properties.length,
    occupiedProperties: properties.filter(p => p.status === "Occupé").length,
    availableProperties: properties.filter(p => p.status === "Disponible").length,
    totalRevenue: properties.reduce((sum, p) => sum + p.revenue, 0),
    averageViews: Math.round(properties.reduce((sum, p) => sum + p.views, 0) / properties.length) || 0
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center space-x-3">
              <Home className="h-8 w-8 text-primary" />
              <span>Gérer mes biens</span>
            </h1>
            <p className="text-muted-foreground">
              {properties.length} bien(s) dans votre portfolio
            </p>
          </div>
          <Button onClick={() => navigate("/add-property")} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Ajouter un bien</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total biens</p>
                  <p className="text-xl font-bold">{stats.totalProperties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Occupés</p>
                  <p className="text-xl font-bold">{stats.occupiedProperties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                  <p className="text-xl font-bold">{stats.availableProperties}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Revenus</p>
                  <p className="text-xl font-bold">{stats.totalRevenue.toLocaleString()} TND</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Vues moy.</p>
                  <p className="text-xl font-bold">{stats.averageViews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par titre ou localisation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Disponible">Disponible</SelectItem>
                  <SelectItem value="Occupé">Occupé</SelectItem>
                  <SelectItem value="En rénovation">En rénovation</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Properties List */}
        <div className="space-y-4">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Image */}
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <Home className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{property.title}</h3>
                          <p className="text-muted-foreground text-sm">{property.address}</p>
                          <p className="text-primary font-medium">{property.price} TND/{property.priceType}</p>
                        </div>
                        <Badge variant={getStatusColor(property.status) as any}>
                          {property.status}
                        </Badge>
                      </div>

                      {/* Tenant Info */}
                      {property.tenant && (
                        <div className="mb-2">
                          <p className="text-sm">
                            <span className="text-muted-foreground">Locataire:</span> {property.tenant}
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Fin de contrat:</span> {new Date(property.contractEnd).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{property.views || 0} vues</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{property.messages || 0} messages</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{(property.revenue || 0).toLocaleString()} TND revenus</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/property/${property.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/edit-property/${property.id}`)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleContractAction(property.id)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Contrat
                    </Button>

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/messages?contact=${property.tenant || 'prospects'}`)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Messages
                    </Button>

                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteProperty(property.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-16">
            <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery || statusFilter ? "Aucun bien trouvé" : "Aucun bien pour le moment"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter 
                ? "Essayez de modifier vos critères de recherche"
                : "Commencez par ajouter votre premier bien"
              }
            </p>
            {!searchQuery && !statusFilter && (
              <Button onClick={() => navigate("/add-property")} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Ajouter un bien</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Contract Action Dialog */}
      <AlertDialog open={showContractDialog} onOpenChange={setShowContractDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gestion des contrats</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedProperty && (
                <>
                  Que souhaitez-vous faire pour le bien "{selectedProperty.title}" ?
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Statut actuel: {selectedProperty.status}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <AlertDialogAction onClick={navigateToContracts} className="w-full">
              Voir tous mes contrats
            </AlertDialogAction>
            <AlertDialogAction onClick={createContractForProperty} className="w-full">
              Créer un nouveau contrat
            </AlertDialogAction>
            <AlertDialogCancel className="w-full">Annuler</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageProperties;