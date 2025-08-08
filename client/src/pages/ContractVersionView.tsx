import React from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import ContractGenerator from "@/components/ContractGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, History, User, Calendar, Edit3, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ContractVersionView = () => {
  const [match, params] = useRoute("/contract/:contractId/version/:versionId");
  const contractId = params?.contractId;
  const versionId = params?.versionId;
  const [, navigate] = useLocation();

  // Fetch main contract data
  const { data: contract, isLoading: contractLoading } = useQuery({
    queryKey: [`/api/contracts/${contractId}`],
    enabled: !!contractId
  });

  // Fetch specific version data
  const { data: version, isLoading: versionLoading } = useQuery({
    queryKey: [`/api/contracts/${contractId}/versions/${versionId}`],
    enabled: !!contractId && !!versionId && versionId !== 'current'
  });

  const isLoading = contractLoading || (versionId !== 'current' && versionLoading);

  // Determine which data to use (current contract or specific version)
  const displayData = versionId === 'current' ? contract : version;
  const isCurrentVersion = versionId === 'current';

  const getUserName = (userId: number) => {
    const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
    if (currentUser.id === userId) {
      return `${currentUser.firstName} ${currentUser.lastName}`;
    }
    return `Utilisateur #${userId}`;
  };

  const getModificationDetails = (data: any) => {
    const details = [];
    
    if (data?.modificationReason) {
      details.push(data.modificationReason);
    }
    
    if (data?.fieldsModified && data.fieldsModified.length > 0) {
      const fieldNames = data.fieldsModified.map((field: string) => {
        switch (field) {
          case 'tenant_cin': return 'CIN du locataire';
          case 'tenant_name': return 'Nom du locataire';
          case 'monthly_rent': return 'Loyer mensuel';
          case 'deposit': return 'Dépôt de garantie';
          case 'start_date': return 'Date de début';
          case 'end_date': return 'Date de fin';
          case 'special_conditions': return 'Conditions spéciales';
          default: return field;
        }
      });
      details.push(`Champs modifiés: ${fieldNames.join(', ')}`);
    }
    
    return details;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Version non trouvée</h1>
            <Button onClick={() => navigate(`/contract/${contractId}/versions`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux versions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const versionNumber = isCurrentVersion ? 'Actuelle' : (version?.version || 'Inconnue');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/contract/${contractId}/versions`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux versions
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate(`/contract/${contractId}`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Contrat principal
            </Button>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <CardTitle className="text-xl">
                      Version {versionNumber} - {displayData.contractData?.propertyTitle || `Contrat #${contractId}`}
                    </CardTitle>
                    <Badge className={isCurrentVersion ? "bg-green-600" : "bg-blue-600"}>
                      {isCurrentVersion ? 'Version Actuelle' : 'Version Archivée'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {isCurrentVersion ? 'Dernière modification' : 'Créée'} le{' '}
                          {format(new Date(displayData.createdAt || displayData.updatedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Par {getUserName(displayData.modifiedBy || displayData.ownerId)}</span>
                      </div>
                    </div>
                    
                    {getModificationDetails(displayData).map((detail, index) => (
                      <div key={index} className="flex items-start gap-1">
                        <Edit3 className="h-4 w-4 mt-0.5 text-blue-500" />
                        <span className="text-blue-700 font-medium">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex gap-2">
                    <Badge variant={displayData.ownerSignature ? "default" : "secondary"}>
                      {displayData.ownerSignature ? '✓' : '✗'} Propriétaire
                    </Badge>
                    <Badge variant={displayData.tenantSignature ? "default" : "secondary"}>
                      {displayData.tenantSignature ? '✓' : '✗'} Locataire
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Contract Display */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <ContractGenerator
            data={displayData.contractData}
            ownerSignature={displayData.ownerSignature}
            tenantSignature={displayData.tenantSignature}
            ownerSignedAt={displayData.ownerSignedAt}
            tenantSignedAt={displayData.tenantSignedAt}
            readOnly={!isCurrentVersion}
            hideActions={true}
          />
        </div>
        
        {!isCurrentVersion && (
          <div className="mt-6 text-center">
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <History className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <p className="text-yellow-800 font-medium">
                  Cette version est archivée et en lecture seule
                </p>
                <p className="text-yellow-700 text-sm">
                  Pour modifier le contrat, retournez à la version actuelle
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractVersionView;