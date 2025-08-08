import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History, FileText, Calendar, User, Edit3 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ContractVersion {
  id: number;
  contractId: number;
  version: number;
  data: any;
  createdAt: string;
  modificationReason?: string;
}

interface Contract {
  id: number;
  status: string;
  contractData: any;
  createdAt: string;
  updatedAt: string;
  modificationSummary?: string;
}

export default function ContractVersions() {
  const [, navigate] = useLocation();
  const contractId = parseInt(window.location.pathname.split('/')[2]);

  // Get current user
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

  // Fetch contract details
  const { data: contract, isLoading: contractLoading } = useQuery({
    queryKey: ['/api/contracts', contractId],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch contract');
      }
      return response.json();
    },
    enabled: !!contractId,
  });

  // Fetch contract versions
  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ['/api/contracts', contractId, 'versions'],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}/versions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch contract versions');
      }
      return response.json();
    },
    enabled: !!contractId,
  });

  const isLoading = contractLoading || versionsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Contrat non trouvé</h1>
          <p className="text-muted-foreground mb-4">
            Le contrat demandé n'existe pas ou vous n'avez pas l'autorisation de le consulter.
          </p>
          <Button onClick={() => navigate("/contracts")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux contrats
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          onClick={() => navigate("/contracts")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Historique des Versions
          </h1>
          <p className="text-muted-foreground">
            Contrat #{contract.id} - {contract.contractData?.propertyTitle || 'Titre non défini'}
          </p>
        </div>
      </div>

      {/* Current Contract Info */}
      <Card className="mb-6 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Version Actuelle</CardTitle>
            <Badge variant="secondary">v{versions.length > 0 ? Math.max(...versions.map((v: ContractVersion) => v.version)) : 1}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Statut:</span>
              <p className="capitalize">{contract.status}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Dernière modification:</span>
              <p>{format(new Date(contract.updatedAt), 'dd MMM yyyy HH:mm', { locale: fr })}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Propriété:</span>
              <p>{contract.contractData?.propertyAddress || 'Adresse non définie'}</p>
            </div>
          </div>
          {contract.modificationSummary && (
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <span className="font-medium text-blue-800">Résumé des modifications:</span>
              <p className="text-blue-700 mt-1">{contract.modificationSummary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Versions Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des Modifications
        </h2>

        {versions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune modification</h3>
              <p className="text-muted-foreground">
                Ce contrat n'a pas encore été modifié depuis sa création.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {versions.map((version: ContractVersion, index: number) => (
              <Card key={version.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                        <CardTitle className="text-lg">Version {version.version}</CardTitle>
                      </div>
                      {index === 0 && (
                        <Badge variant="secondary">Dernière</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(version.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {version.modificationReason && (
                      <div>
                        <span className="font-medium text-muted-foreground flex items-center gap-2">
                          <Edit3 className="h-4 w-4" />
                          Raison de la modification:
                        </span>
                        <p className="mt-1">{version.modificationReason}</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-muted-foreground flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Modifié par:
                      </span>
                      <p className="mt-1">
                        {version.data?.modifiedBy === currentUserId ? 'Vous' : 'Propriétaire'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Key Changes Preview */}
                  {version.data && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Données de cette version:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {version.data.monthlyRent && (
                          <div>
                            <span className="text-muted-foreground">Loyer mensuel:</span>
                            <span className="ml-2 font-medium">{version.data.monthlyRent}€</span>
                          </div>
                        )}
                        {version.data.propertyTitle && (
                          <div>
                            <span className="text-muted-foreground">Titre:</span>
                            <span className="ml-2 font-medium">{version.data.propertyTitle}</span>
                          </div>
                        )}
                        {version.data.leaseDuration && (
                          <div>
                            <span className="text-muted-foreground">Durée:</span>
                            <span className="ml-2 font-medium">{version.data.leaseDuration} mois</span>
                          </div>
                        )}
                        {version.data.securityDeposit && (
                          <div>
                            <span className="text-muted-foreground">Caution:</span>
                            <span className="ml-2 font-medium">{version.data.securityDeposit}€</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}