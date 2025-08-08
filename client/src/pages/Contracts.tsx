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
  Plus,
  Download,
  Eye,
  Edit,
  Send,
  Calendar,
  DollarSign,
  User,
  Home,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  ArrowUpDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContractStatusBadge } from "@/components/ContractStatusBadge";
import { EnhancedContractActions } from "@/components/EnhancedContractActions";

const Contracts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState("contracts");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get user authentication
  const currentUserId = Number(localStorage.getItem("userId"));
  const userType = localStorage.getItem("userType") as 'tenant' | 'owner';
  
  // Fetch contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/contracts'],
    enabled: !!currentUserId
  });
  
  // Fetch contract modification requests
  const { data: modificationRequests = [], isLoading: modRequestsLoading } = useQuery({
    queryKey: ['/api/contract-modification-requests'],
    enabled: !!currentUserId
  });
  
  // Fetch contract termination requests  
  const { data: terminationRequests = [], isLoading: termRequestsLoading } = useQuery({
    queryKey: ['/api/contract-termination-requests'],
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

  // Filter contracts based on search and status
  const filteredContracts = (contracts as any[]).filter((contract: any) => {
    const contractData = contract.contractData ? JSON.parse(contract.contractData) : {};
    const propertyTitle = contractData.propertyTitle || '';
    const tenantName = contractData.tenantName || '';
    const ownerName = contractData.landlordName || '';
    
    const matchesSearch = propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ownerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "" || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Filter requests based on user type
  const userModificationRequests = (modificationRequests as any[]).filter((req: any) => 
    userType === 'owner' ? req.requestedBy !== currentUserId : req.requestedBy === currentUserId
  );
  
  const userTerminationRequests = (terminationRequests as any[]).filter((req: any) => 
    userType === 'owner' ? req.requestedBy !== currentUserId : req.requestedBy === currentUserId
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Actif": return "success";
      case "En attente de signature": return "warning";
      case "En cours de négociation": return "secondary";
      case "Expiré": return "destructive";
      case "Résilié": return "outline";
      default: return "outline";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "À jour": return "success";
      case "En retard": return "destructive";
      case "En attente": return "warning";
      default: return "outline";
    }
  };

  const generateNewContract = () => {
    navigate("/create-contract");
  };

  const signContract = (contractId: number) => {
    // This will be handled by the contract signing component
    toast({
      title: "Contrat signé",
      description: "Le contrat a été signé numériquement avec succès",
    });
  };

  const downloadContract = (contractUrl: string) => {
    // Mock download
    toast({
      title: "Téléchargement",
      description: "Le contrat PDF est en cours de téléchargement",
    });
  };

  const sendContractForSignature = (contractId: number) => {
    toast({
      title: "Contrat envoyé",
      description: "Le contrat a été envoyé pour signature numérique",
    });
  };

  // Calculate stats
  const stats = {
    totalContracts: (contracts as any[]).length,
    activeContracts: (contracts as any[]).filter((c: any) => c.status === "active").length,
    pendingContracts: (contracts as any[]).filter((c: any) => c.status === "owner_signed" || c.status === "draft").length,
    totalRevenue: userType === "owner" ? (contracts as any[]).reduce((sum: number, c: any) => {
      const contractData = c.contractData ? JSON.parse(c.contractData) : {};
      return sum + (parseFloat(contractData.monthlyRent) || 0);
    }, 0) : 0,
    monthlyPayments: (contracts as any[]).filter((c: any) => c.status === "active").reduce((sum: number, c: any) => {
      const contractData = c.contractData ? JSON.parse(c.contractData) : {};
      return sum + (parseFloat(contractData.monthlyRent) || 0);
    }, 0)
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <span>Mes Contrats</span>
            </h1>
            <p className="text-muted-foreground">
              {(contracts as any[]).length} contrat(s) {userType === "owner" ? "propriétaire" : "locataire"}
            </p>
          </div>
          {userType === "owner" && (
            <Button onClick={generateNewContract} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nouveau contrat</span>
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total contrats</p>
                  <p className="text-xl font-bold">{stats.totalContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Actifs</p>
                  <p className="text-xl font-bold">{stats.activeContracts}</p>
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
                  <p className="text-xl font-bold">{stats.pendingContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {userType === "owner" ? "Revenus totaux" : "Paiements mensuels"}
                  </p>
                  <p className="text-xl font-bold">
                    {userType === "owner" ? stats.totalRevenue.toLocaleString() : stats.monthlyPayments.toLocaleString()} TND
                  </p>
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
                <Input
                  placeholder="Rechercher par propriété, locataire/propriétaire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="en-attente">En attente de signature</SelectItem>
                  <SelectItem value="negociation">En cours de négociation</SelectItem>
                  <SelectItem value="expire">Expiré</SelectItem>
                  <SelectItem value="resilie">Résilié</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contracts">Mes Contrats</TabsTrigger>
            <TabsTrigger value="modification-requests">
              {userType === 'owner' ? 'Demandes de modification reçues' : 'Mes demandes de modification'}
            </TabsTrigger>
            <TabsTrigger value="termination-requests">
              {userType === 'owner' ? 'Demandes de résiliation reçues' : 'Mes demandes de résiliation'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="contracts" className="space-y-4 mt-6">
            {contractsLoading ? (
              <div className="text-center py-8">Chargement des contrats...</div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun contrat trouvé
              </div>
            ) : (
              filteredContracts.map((contract: any) => (
            <Card key={contract.id} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {(() => {
                      const contractData = contract.contractData ? JSON.parse(contract.contractData) : {};
                      return (
                        <>
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center space-x-2">
                                <Home className="h-4 w-4" />
                                <span>{contractData.propertyTitle || 'Propriété'}</span>
                              </h3>
                              <p className="text-muted-foreground text-sm">{contractData.propertyAddress || 'Adresse non disponible'}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <ContractStatusBadge status={contract.status} />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {userType === "owner" ? "Locataire" : "Propriétaire"}
                              </p>
                              <p className="font-medium flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{userType === "owner" ? contractData.tenantName : contractData.landlordName}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {userType === "owner" ? contractData.tenantPhone : contractData.ownerPhone}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground">Période</p>
                              <p className="font-medium flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {contractData.startDate && contractData.endDate ? 
                                    `${new Date(contractData.startDate).toLocaleDateString('fr-FR')} - ${new Date(contractData.endDate).toLocaleDateString('fr-FR')}` :
                                    'Dates non définies'
                                  }
                                </span>
                              </p>
                              {contract.ownerSignedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Signé le {new Date(contract.ownerSignedAt).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground">Montants</p>
                              <p className="font-medium flex items-center space-x-1">
                                <DollarSign className="h-3 w-3" />
                                <span>{contractData.monthlyRent || '0'} TND/mois</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Caution: {contractData.deposit || '0'} TND
                              </p>
                            </div>
                          </div>

                          {/* Contract Actions for Active Contracts */}
                          {contract.status === 'active' && userType === 'owner' && (
                            <div className="mt-4">
                              <EnhancedContractActions 
                                contract={contract}
                                currentUserId={currentUserId}
                                userType={userType}
                              />
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-6">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/contract/${contract.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>

                    {(contract.status === 'fully_signed' || contract.status === 'active') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadContract(`/api/contracts/${contract.id}/download`)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="modification-requests" className="space-y-4 mt-6">
            {modRequestsLoading ? (
              <div className="text-center py-8">Chargement des demandes...</div>
            ) : userModificationRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {userType === 'owner' ? 'Aucune demande de modification reçue' : 'Aucune demande de modification envoyée'}
              </div>
            ) : (
              userModificationRequests.map((request: any) => (
                <Card key={request.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Edit className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">Demande de modification de contrat</h3>
                          <Badge variant={request.status === 'pending' ? 'warning' : request.status === 'accepted' ? 'success' : 'destructive'}>
                            {request.status === 'pending' ? 'En attente' : request.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Contrat ID: {request.contractId}
                        </p>
                        <p className="text-sm mb-2">
                          <strong>Raison:</strong> {request.reason || 'Non spécifiée'}
                        </p>
                        {request.fieldsToModify && (
                          <p className="text-sm mb-2">
                            <strong>Champs à modifier:</strong> {request.fieldsToModify}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Demandé le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {request.status === 'pending' && userType === 'tenant' && request.requestedBy !== currentUserId && (
                          <>
                            <Button size="sm" variant="default">
                              Accepter
                            </Button>
                            <Button size="sm" variant="outline">
                              Refuser
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="termination-requests" className="space-y-4 mt-6">
            {termRequestsLoading ? (
              <div className="text-center py-8">Chargement des demandes...</div>
            ) : userTerminationRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {userType === 'owner' ? 'Aucune demande de résiliation reçue' : 'Aucune demande de résiliation envoyée'}
              </div>
            ) : (
              userTerminationRequests.map((request: any) => (
                <Card key={request.id} className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <h3 className="font-semibold">Demande de résiliation de contrat</h3>
                          <Badge variant={request.status === 'pending' ? 'warning' : request.status === 'accepted' ? 'success' : 'destructive'}>
                            {request.status === 'pending' ? 'En attente' : request.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Contrat ID: {request.contractId}
                        </p>
                        <p className="text-sm mb-2">
                          <strong>Raison:</strong> {request.reason || 'Non spécifiée'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Demandé le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {request.status === 'pending' && userType === 'tenant' && request.requestedBy !== currentUserId && (
                          <>
                            <Button size="sm" variant="destructive">
                              Accepter
                            </Button>
                            <Button size="sm" variant="outline">
                              Refuser
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Contracts;