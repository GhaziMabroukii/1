import React from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, History, User, Calendar, FileText, Edit3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ContractVersions = () => {
  const [match, params] = useRoute("/contract/:id/versions");
  const contractId = params?.id;
  const [, navigate] = useLocation();
  
  // Debug logging
  console.log('ContractVersions Debug:', { match, params, contractId });

  // Fetch all versions for this contract
  const { data: versions = [], isLoading: versionsLoading, error: versionsError } = useQuery({
    queryKey: [`/api/contracts/${contractId}/versions`],
    enabled: !!contractId
  });
  
  // Debug logging for queries
  console.log('ContractVersions Queries Debug:', {
    contractId,
    versions,
    versionsLoading,
    versionsError,
    versionsLength: Array.isArray(versions) ? versions.length : 0
  });

  // Type the versions data
  const typedVersions = versions as any[];

  const isLoading = versionsLoading;

  // Show loading state first
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Only show "contract not found" if versions fail to load
  if (typedVersions.length === 0 && !versionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Contrat non trouvé</h1>
            <Button onClick={() => navigate('/contracts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux contrats
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge className="bg-green-600">Version Actuelle</Badge>;
      case 'superseded':
        return <Badge variant="secondary">Version Précédente</Badge>;
      case 'draft':
        return <Badge variant="outline">Brouillon</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getModificationDetails = (version: any) => {
    const details = [];
    
    if (version.modificationReason) {
      details.push(version.modificationReason);
    }
    
    return details;
  };

  const getUserName = (userId: number) => {
    const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
    if (currentUser.id === userId) {
      return `${currentUser.firstName} ${currentUser.lastName}`;
    }
    return `Utilisateur #${userId}`;
  };

  const allVersions = typedVersions.sort((a, b) => b.version - a.version);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/contract/${contractId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au contrat
          </Button>
          
          <div className="flex items-center gap-4 mb-2">
            <History className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Historique des versions - Contrat #{contractId}
            </h1>
          </div>
          
          <p className="text-muted-foreground">
            Consultez toutes les versions de ce contrat et les modifications apportées
          </p>
        </div>

        <div className="space-y-6">
          {allVersions.map((version) => (
            <Card key={version.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <CardTitle className="text-lg">
                        Version {version.version}
                      </CardTitle>
                      {getStatusBadge(version.status)}
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {version.status === 'current' ? 'Contrat Principal' : 'Archive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {version.status === 'current' ? 'Dernière modification' : 'Créée'} le{' '}
                            {format(new Date(version.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>
                      
                      {getModificationDetails(version).map((detail, index) => (
                        <div key={index} className="flex items-start gap-1">
                          <Edit3 className="h-4 w-4 mt-0.5 text-blue-500" />
                          <span className="text-blue-700 font-medium">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/contract/${contractId}/version/${version.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir cette version
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Propriété:</span>
                    <p className="text-muted-foreground">
                      📍 {version.contractData?.propertyAddress || 'Non spécifiée'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Loyer:</span>
                    <p className="text-muted-foreground">
                      💰 {version.contractData?.monthlyRent || '0'}€/mois
                    </p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Signatures:</span>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={version.ownerSignature ? "default" : "secondary"} className="text-xs">
                        {version.ownerSignature ? '✓' : '✗'} Propriétaire
                      </Badge>
                      <Badge variant={version.tenantSignature ? "default" : "secondary"} className="text-xs">
                        {version.tenantSignature ? '✓' : '✗'} Locataire
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {allVersions.length === 0 && (
            <Card className="text-center py-8 border-dashed">
              <CardContent>
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune version archivée</h3>
                <p className="text-muted-foreground">
                  Ce contrat n'a pas encore d'historique de modifications. Les versions précédentes apparaîtront ici après les modifications.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractVersions;