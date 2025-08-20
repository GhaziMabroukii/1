import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from '@tanstack/react-query';
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  AlertCircle,
  Calendar,
  User,
  Home,
  Clock,
  Search,
  Filter,
  Plus,
  DollarSign,
  Send,
  CheckCircle
} from "lucide-react";

const ContractTermination = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL parameters for tab preference
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    return tabParam === 'my-requests' ? 'my-requests' : 'start-termination';
  });
  const [, navigate] = useLocation();
  
  // Get user authentication
  const currentUserId = Number(localStorage.getItem("userId"));
  const userType = localStorage.getItem("userType") as 'tenant' | 'owner';
  
  // Fetch contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/contracts', currentUserId, userType],
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: currentUserId.toString(),
        ownerOnly: (userType === 'owner').toString()
      });
      const response = await fetch(`/api/contracts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      return response.json();
    },
    enabled: !!currentUserId
  });
  
  
  // Get requests that user SENT (created by them)
  const { data: sentRequests = [], isLoading: sentRequestsLoading } = useQuery({
    queryKey: userType === 'owner' 
      ? [`/api/owner-requests/${currentUserId}`] 
      : [`/api/tenant-requests/${currentUserId}`],
    enabled: !!currentUserId
  });

  // Get requests that user RECEIVED (from the opposite user type)
  const { data: receivedRequests = [], isLoading: receivedRequestsLoading } = useQuery({
    queryKey: userType === 'owner' 
      ? [`/api/tenant-requests/${currentUserId}`] 
      : [`/api/owner-requests/${currentUserId}`],
    enabled: !!currentUserId
  });

  useEffect(() => {
    // Check authentication
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  // Filter active contracts for the current user
  const activeContracts = (contracts as any[]).filter((contract: any) => {
    const isUserContract = userType === 'owner' ? 
      contract.ownerId === currentUserId : 
      contract.tenantId === currentUserId;
    // Include contracts that are available for termination
    const isActiveStatus = contract.status === 'active' || 
                          contract.status === 'fully_signed' || 
                          contract.status === 'owner_signed';
    
    return isUserContract && isActiveStatus;
  });
  
  // Data is already split by the API calls above
  // sentRequests = requests created by current user
  // receivedRequests = requests created by other users that current user needs to respond to

  // Filter sent requests based on search and status  
  const filteredSentRequests = (sentRequests as any[]).filter((request: any) => {
    const matchesSearch = request.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.contractId?.toString().includes(searchQuery);
    const matchesStatus = statusFilter === "" || statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter received requests based on search and status
  const filteredReceivedRequests = (receivedRequests as any[]).filter((request: any) => {
    const matchesSearch = request.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.contractId?.toString().includes(searchQuery);
    const matchesStatus = statusFilter === "" || statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "accepted": return "default";
      case "completed": return "default";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "accepted": return "Acceptée";
      case "completed": return "Terminé";
      case "rejected": return "Refusée";
      default: return status;
    }
  };

  // Calculate stats
  const allUserRequests = [...(sentRequests as any[]), ...(receivedRequests as any[])];
  const stats = {
    activeContracts: activeContracts.length,
    totalRequests: allUserRequests.length,
    pendingRequests: allUserRequests.filter(req => req.status === 'pending').length,
    acceptedRequests: allUserRequests.filter(req => req.status === 'accepted').length,
    completedRequests: allUserRequests.filter(req => req.status === 'completed').length,
  };
  
  const handleStartTermination = async (contractId: number) => {
    if (userType === 'owner') {
      // Owner goes to termination request form
      navigate(`/owner-termination-request/${contractId}`);
    } else {
      navigate(`/tenant-termination-request/${contractId}`);
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
              <AlertCircle className="h-8 w-8 text-destructive" />
              <span>Arrêt de Contrat Bilatéral</span>
            </h1>
            <p className="text-muted-foreground">
              Système complet d'arrêt de contrat avec confirmation des deux parties et signatures électroniques.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Contrats actifs</p>
                  <p className="text-xl font-bold">{stats.activeContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total demandes</p>
                  <p className="text-xl font-bold">{stats.totalRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-xl font-bold">{stats.pendingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Acceptées</p>
                  <p className="text-xl font-bold">{stats.acceptedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Terminées</p>
                  <p className="text-xl font-bold">{stats.completedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="start-termination">Démarrer Arrêt de Contrat</TabsTrigger>
            <TabsTrigger value="my-requests">Mes Demandes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="start-termination" className="space-y-4 mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-primary" />
                  <span>Sélectionner un contrat à résilier</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contractsLoading ? (
                    <div className="text-center py-8">Chargement des contrats...</div>
                  ) : activeContracts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun contrat actif disponible pour résiliation
                    </div>
                  ) : (
                    activeContracts.map((contract: any) => {
                      const contractData = contract.contractData || {};
                      return (
                        <Card key={contract.id} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Home className="h-5 w-5 text-primary" />
                                  <h3 className="font-semibold text-lg">{contractData.propertyTitle || 'Propriété'}</h3>
                                  <Badge variant="default">Actif</Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Adresse</p>
                                    <p className="font-medium">{contractData.propertyAddress || 'Non spécifiée'}</p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                      {userType === 'owner' ? 'Locataire' : 'Propriétaire'}
                                    </p>
                                    <p className="font-medium flex items-center space-x-1">
                                      <User className="h-3 w-3" />
                                      <span>{userType === 'owner' ? contractData.tenantName : contractData.landlordName}</span>
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Loyer mensuel</p>
                                    <p className="font-medium flex items-center space-x-1">
                                      <DollarSign className="h-3 w-3" />
                                      <span>{contractData.monthlyRent || '0'} TND</span>
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Début: {contractData.startDate ? new Date(contractData.startDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>Fin: {contractData.endDate ? new Date(contractData.endDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col space-y-2">
                                <Button 
                                  variant="destructive"
                                  onClick={() => handleStartTermination(contract.id)}
                                  className="flex items-center space-x-2"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                  <span>Démarrer l'arrêt</span>
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/contract/${contract.id}`)}
                                >
                                  Voir détails
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-requests" className="space-y-4 mt-6">
            {/* Filters */}
            <Card className="glass-card mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Rechercher par raison ou ID de contrat..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="accepted">Acceptées</SelectItem>
                      <SelectItem value="completed">Terminées</SelectItem>
                      <SelectItem value="rejected">Refusées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Received Requests Section */}
            <Card className="glass-card mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span>Demandes de résiliation reçues</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {receivedRequestsLoading ? (
                    <div className="text-center py-8">Chargement des demandes...</div>
                  ) : filteredReceivedRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune demande de résiliation reçue
                    </div>
                  ) : (
                    filteredReceivedRequests.map((request: any) => (
                      <Card key={request.id} className="border-l-4 border-l-destructive">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-3">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                <h3 className="font-semibold text-lg">Demande de résiliation #{request.id}</h3>
                                <Badge variant={getStatusVariant(request.status)}>
                                  {getStatusText(request.status)}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Contrat concerné</p>
                                  <p className="font-medium flex items-center space-x-1">
                                    <FileText className="h-3 w-3" />
                                    <span>Contrat #{request.contractId}</span>
                                  </p>
                                </div>

                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Date de demande</p>
                                  <p className="font-medium flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="mb-4">
                                <p className="text-sm text-muted-foreground mb-1">Raison de la résiliation</p>
                                <p className="text-sm bg-muted p-3 rounded">
                                  {request.reason || 'Aucune raison spécifiée'}
                                </p>
                              </div>

                              {request.detailedExplanation && (
                                <div className="mb-4">
                                  <p className="text-sm text-muted-foreground mb-1">Explication détaillée</p>
                                  <p className="text-sm bg-muted p-3 rounded">
                                    {request.detailedExplanation}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col space-y-2">
                              {request.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="destructive">
                                    Accepter
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    Refuser
                                  </Button>
                                </>
                              )}
                              {request.status === 'accepted' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => navigate(`/${userType}-termination-workflow/${request.id}`)}
                                >
                                  Continuer le processus
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => navigate(`/contract/${request.contractId}`)}
                              >
                                Voir le contrat
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sent Requests Section */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5 text-primary" />
                  <span>Demandes de résiliation envoyées</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sentRequestsLoading ? (
                    <div className="text-center py-8">Chargement des demandes...</div>
                  ) : filteredSentRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune demande de résiliation envoyée
                    </div>
                  ) : (
                    filteredSentRequests.map((request: any) => (
                      <Card key={request.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-3">
                                <Send className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold text-lg">Demande de résiliation #{request.id}</h3>
                                <Badge variant={getStatusVariant(request.status)}>
                                  {getStatusText(request.status)}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Contrat concerné</p>
                                  <p className="font-medium flex items-center space-x-1">
                                    <FileText className="h-3 w-3" />
                                    <span>Contrat #{request.contractId}</span>
                                  </p>
                                </div>

                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">Date de demande</p>
                                  <p className="font-medium flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(request.createdAt).toLocaleDateString('fr-FR')}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="mb-4">
                                <p className="text-sm text-muted-foreground mb-1">Raison de la résiliation</p>
                                <p className="text-sm bg-muted p-3 rounded">
                                  {request.reason || 'Aucune raison spécifiée'}
                                </p>
                              </div>

                              {request.detailedExplanation && (
                                <div className="mb-4">
                                  <p className="text-sm text-muted-foreground mb-1">Explication détaillée</p>
                                  <p className="text-sm bg-muted p-3 rounded">
                                    {request.detailedExplanation}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col space-y-2">
                              {request.status === 'accepted' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => navigate(`/${userType}-termination-workflow/${request.id}`)}
                                >
                                  Continuer le processus
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => navigate(`/contract/${request.contractId}`)}
                              >
                                Voir le contrat
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ContractTermination;