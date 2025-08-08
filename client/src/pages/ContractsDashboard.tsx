import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { ContractStatusBadge } from "@/components/ContractStatusBadge";
import { NotificationCenter } from "@/components/NotificationCenter";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Plus, Eye, Edit, Clock, AlertTriangle, History } from "lucide-react";

interface Contract {
  id: number;
  status: string;
  contractData: any;
  tenantSignDeadline?: string | null;
  createdAt: string;
  ownerId: number;
  tenantId: number;
  ownerSignature?: string | null;
  tenantSignature?: string | null;
  ownerSignedAt?: string | null;
  tenantSignedAt?: string | null;
}

export default function ContractsDashboard() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'active' | 'terminated' | 'modified'>('active');
  
  // Get current user from localStorage (real session management)
  const getCurrentUser = () => {
    const userData = localStorage.getItem("userData");
    const userId = localStorage.getItem("userId");
    const userType = localStorage.getItem("userType");
    
    if (userData && userId && userType) {
      try {
        const user = JSON.parse(userData);
        return {
          id: parseInt(userId),
          userType: userType,
          ...user
        };
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  };

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id || 0;
  const userType = currentUser?.userType || 'tenant';

  // Fetch user's contracts based on their role
  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ['/api/contracts', currentUserId, userType],
    queryFn: async () => {
      // For owners: get contracts they created (ownerOnly=true)
      // For tenants: get contracts assigned to them (ownerOnly=false)
      const ownerOnly = userType === 'owner';
      console.log(`Fetching contracts for user ${currentUserId}, userType: ${userType}, ownerOnly: ${ownerOnly}`);
      
      const response = await fetch(`/api/contracts?userId=${currentUserId}&ownerOnly=${ownerOnly}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Failed to fetch contracts: ${response.status} ${response.statusText}`, errorData);
        throw new Error(`Failed to fetch contracts: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Received ${data.length} contracts:`, data);
      return data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    enabled: !!currentUserId && !!userType, // Only fetch if user is logged in and userType is set
  });

  // Categorize contracts by status with more detailed filtering
  const activeContracts = contracts.filter((contract: Contract) => 
    ['active', 'fully_signed', 'owner_signed', 'draft', 'waiting_for_modification'].includes(contract.status)
  );
  
  const terminatedContracts = contracts.filter((contract: Contract) => 
    contract.status === 'terminated'
  );
  
  const modifiedContracts = contracts.filter((contract: Contract) => 
    contract.status === 'modified' || contract.modificationSummary?.includes('Version')
  );

  // Further categorize active contracts for better display
  const pendingOwnerSignature = activeContracts.filter((c: Contract) => c.status === 'draft' && !c.ownerSignature);
  const pendingTenantSignature = activeContracts.filter((c: Contract) => c.status === 'owner_signed' && !c.tenantSignature);
  const fullySignedContracts = activeContracts.filter((c: Contract) => c.status === 'fully_signed' || c.status === 'active');
  const waitingForModification = activeContracts.filter((c: Contract) => c.status === 'waiting_for_modification');

  // Helper function to get signature status
  const getSignatureStatus = (contract: Contract) => {
    if (contract.ownerSignature && contract.tenantSignature) {
      return {
        status: 'fully_signed',
        text: 'Signé par les deux parties',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: '✓'
      };
    } else if (contract.ownerSignature && !contract.tenantSignature) {
      return {
        status: 'pending_tenant',
        text: 'En attente de signature du locataire',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: '⏳'
      };
    } else if (!contract.ownerSignature) {
      return {
        status: 'pending_owner',
        text: 'En attente de signature du propriétaire',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: '📝'
      };
    }
    return {
      status: 'draft',
      text: 'Brouillon',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      icon: '📄'
    };
  };

  // Helper function to get next action
  const getNextAction = (contract: Contract) => {
    if (contract.status === 'waiting_for_modification') {
      return 'Modification en cours';
    }
    if (!contract.ownerSignature && contract.ownerId === currentUserId) {
      return 'Votre signature requise';
    }
    if (contract.ownerSignature && !contract.tenantSignature && contract.ownerId !== currentUserId) {
      return 'Votre signature requise';
    }
    if (contract.ownerSignature && !contract.tenantSignature && contract.ownerId === currentUserId) {
      return 'En attente du locataire';
    }
    if (contract.ownerSignature && contract.tenantSignature) {
      return 'Contrat actif';
    }
    return 'Action inconnue';
  };

  // Debug logging
  console.log('ContractsDashboard Debug:', {
    currentUser,
    currentUserId,
    userType,
    contractsCount: contracts.length,
    activeContracts: activeContracts.length,
    terminatedContracts: terminatedContracts.length,
    modifiedContracts: modifiedContracts.length,
    contracts,
    isLoading,
    error
  });

  const getContractTitle = (contract: Contract) => {
    return contract.contractData?.propertyTitle || `Contrat #${contract.id}`;
  };

  const getContractRole = (contract: Contract) => {
    return contract.ownerId === currentUserId ? 'Propriétaire' : 'Locataire';
  };

  const canModifyContract = (contract: Contract) => {
    // Owner can modify if:
    // 1. They are the owner
    // 2. Tenant hasn't signed yet
    // 3. Contract is not expired or cancelled
    return contract.ownerId === currentUserId && 
           !contract.tenantSignature && 
           !['expired', 'cancelled'].includes(contract.status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'owner_signed': return 'text-yellow-600';
      case 'fully_signed': return 'text-blue-600';
      case 'expired': return 'text-red-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
          <p className="text-muted-foreground mb-4">
            Impossible de charger les contrats. Veuillez vérifier votre connexion.
          </p>
          <p className="text-sm text-red-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {userType === 'owner' ? 'Mes Contrats' : 'Mes Contrats Reçus'}
          </h1>
          <p className="text-muted-foreground">
            {userType === 'owner' 
              ? 'Gérez vos contrats de location et suivez leur statut'
              : 'Consultez et signez vos contrats de location reçus'
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationCenter userId={currentUserId} />
          {/* Only owners can create new contracts */}
          {userType === 'owner' && (
            <Button onClick={() => navigate("/create-contract")}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Contrat
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'terminated' | 'modified')} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contrats Actifs ({activeContracts.length})
            {pendingOwnerSignature.length + pendingTenantSignature.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {pendingOwnerSignature.length + pendingTenantSignature.length} en attente
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="terminated" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Contrats Terminés ({terminatedContracts.length})
          </TabsTrigger>
          <TabsTrigger value="modified" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Contrats Modifiés ({modifiedContracts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeContracts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun contrat actif</h3>
                <p className="text-muted-foreground mb-6">
                  {userType === 'owner' 
                    ? 'Vous n\'avez pas encore de contrats actifs. Créez votre premier contrat pour commencer.'
                    : 'Vous n\'avez pas encore de contrats actifs. Les propriétaires vous enverront des contrats à signer.'
                  }
                </p>
                {userType === 'owner' && (
                  <Button onClick={() => navigate("/create-contract")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un contrat
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {pendingOwnerSignature.length}
                    </div>
                    <div className="text-sm text-muted-foreground">En attente propriétaire</div>
                  </CardContent>
                </Card>
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {pendingTenantSignature.length}
                    </div>
                    <div className="text-sm text-muted-foreground">En attente locataire</div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {fullySignedContracts.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Entièrement signés</div>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {waitingForModification.length}
                    </div>
                    <div className="text-sm text-muted-foreground">En modification</div>
                  </CardContent>
                </Card>
              </div>

              {/* Contract List */}
              <div className="grid gap-4">
                {activeContracts.map((contract: Contract) => {
                  const signatureStatus = getSignatureStatus(contract);
                  const nextAction = getNextAction(contract);
                  
                  return (
                    <Card key={contract.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-lg">
                                {getContractTitle(contract)}
                              </CardTitle>
                              <ContractStatusBadge 
                                status={contract.status} 
                                tenantSignDeadline={contract.tenantSignDeadline}
                              />
                              <Badge variant="outline" className="text-xs">
                                {getContractRole(contract)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span>Contrat #{contract.id}</span>
                              <span>Créé le {format(new Date(contract.createdAt), 'dd MMM yyyy', { locale: fr })}</span>
                              {contract.tenantSignDeadline && contract.status === 'owner_signed' && (
                                <span className="text-yellow-600 font-medium">
                                  Échéance: {format(new Date(contract.tenantSignDeadline), 'dd MMM yyyy HH:mm', { locale: fr })}
                                </span>
                              )}
                            </div>
                            
                            {/* Signature Status */}
                            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${signatureStatus.bgColor} ${signatureStatus.color} mb-2`}>
                              <span className="text-base">{signatureStatus.icon}</span>
                              {signatureStatus.text}
                            </div>
                            
                            {/* Next Action */}
                            <div className="text-sm font-medium text-blue-600">
                              📋 Action suivante: {nextAction}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/contract/${contract.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </Button>
                            {canModifyContract(contract) && userType === 'owner' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/create-contract?edit=${contract.id}`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {contract.contractData?.propertyAddress && (
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">📍 Adresse:</span>
                              <p className="font-medium">{contract.contractData.propertyAddress}</p>
                            </div>
                            {contract.contractData?.monthlyRent && (
                              <div>
                                <span className="text-muted-foreground">💰 Loyer:</span>
                                <p className="font-medium">{contract.contractData.monthlyRent}€/mois</p>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">👥 Signatures:</span>
                              <div className="flex gap-2 mt-1">
                                <Badge variant={contract.ownerSignature ? "default" : "secondary"} className="text-xs">
                                  Propriétaire {contract.ownerSignature ? "✓" : "✗"}
                                </Badge>
                                <Badge variant={contract.tenantSignature ? "default" : "secondary"} className="text-xs">
                                  Locataire {contract.tenantSignature ? "✓" : "✗"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="terminated" className="mt-6">
          {terminatedContracts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun contrat terminé</h3>
                <p className="text-muted-foreground">
                  Aucun contrat n'a été terminé anticipativement.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {terminatedContracts.map((contract: Contract) => (
                <Card key={contract.id} className="hover:shadow-md transition-shadow border-red-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">
                            {getContractTitle(contract)}
                          </CardTitle>
                          <Badge variant="destructive">Terminé</Badge>
                          <Badge variant="outline" className="text-xs">
                            {getContractRole(contract)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Contrat #{contract.id}</span>
                          <span>Terminé le {contract.terminatedAt ? format(new Date(contract.terminatedAt), 'dd MMM yyyy', { locale: fr }) : 'N/A'}</span>
                          {contract.terminationReason && (
                            <span className="text-red-600 font-medium">
                              Raison: {contract.terminationReason}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/contract/${contract.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir Détails
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {contract.contractData?.propertyAddress && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        📍 {contract.contractData.propertyAddress}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="modified" className="mt-6">
          {modifiedContracts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun contrat modifié</h3>
                <p className="text-muted-foreground">
                  Aucun contrat n'a été modifié depuis sa création.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {modifiedContracts.map((contract: Contract) => (
                <Card key={contract.id} className="hover:shadow-md transition-shadow border-blue-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">
                            {getContractTitle(contract)}
                          </CardTitle>
                          <Badge variant="secondary">Modifié</Badge>
                          <Badge variant="outline" className="text-xs">
                            {getContractRole(contract)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Contrat #{contract.id}</span>
                          <span>Modifié le {format(new Date(contract.updatedAt), 'dd MMM yyyy', { locale: fr })}</span>
                          {contract.modificationSummary && (
                            <span className="text-blue-600 font-medium">
                              {contract.modificationSummary}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/contract/${contract.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Version Actuelle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/contract/${contract.id}/versions`)}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Historique
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {contract.contractData?.propertyAddress && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        📍 {contract.contractData.propertyAddress}
                      </p>
                      {contract.contractData?.monthlyRent && (
                        <p className="text-sm font-medium mt-1">
                          💰 {contract.contractData.monthlyRent}€/mois
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}