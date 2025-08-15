import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { ContractTerminationWorkflow } from '@/components/ContractTerminationWorkflow';

interface CurrentUser {
  id: number;
  name: string;
}

export function TenantTerminationWorkflow() {
  const [match, params] = useRoute("/tenant-termination-workflow/:requestId");
  const requestId = params?.requestId;
  const [, navigate] = useLocation();
  
  const currentUser: CurrentUser = JSON.parse(localStorage.getItem('currentUser') || '{"id": 0, "name": ""}');

  // Fetch termination request details
  const { data: request, isLoading } = useQuery({
    queryKey: [`/api/contract-termination-requests/${requestId}`],
    enabled: !!requestId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="animate-pulse">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Demande introuvable</h1>
          <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/contract/${request.contractId}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au contrat
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Processus de validation</h1>
            <p className="text-gray-600">Contrat #{request.contractId} - Vue locataire</p>
          </div>
        </div>

        <ContractTerminationWorkflow
          request={request}
          currentUserType="tenant"
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  );
}

export default TenantTerminationWorkflow;