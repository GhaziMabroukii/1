import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { ContractTerminationWorkflow } from '@/components/ContractTerminationWorkflow';
import { apiRequest } from '@/lib/queryClient';

interface TerminationRequest {
  id: number;
  contractId: number;
  requestedBy: number;
  reason: string;
  detailedReason?: string;
  terminationType: string;
  proposedTerms?: any;
  status: "pending" | "accepted" | "completed" | "rejected" | "signed";
  ownerPasswordConfirmed: boolean;
  tenantPasswordConfirmed: boolean;
  ownerSignature?: string;
  tenantSignature?: string;
  createdAt: string;
  updatedAt: string;
}

export function OwnerTerminationWorkflow() {
  const [match, params] = useRoute("/owner-termination-workflow/:requestId?");
  const requestId = params?.requestId;
  const [, navigate] = useLocation();
  
  const currentUserId = Number(localStorage.getItem("userId")) || 0;

  // Fetch termination request details
  const { data: request, isLoading, error } = useQuery<TerminationRequest>({
    queryKey: [`/api/contract-termination-requests/${requestId}`],
    queryFn: () => apiRequest(`/api/contract-termination-requests/${requestId}`),
    enabled: !!requestId && !!currentUserId,
    retry: 2,
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  console.log('OwnerTerminationWorkflow Debug:', {
    requestId,
    currentUserId,
    isLoading,
    error,
    hasData: !!request,
    requestData: request
  });

  console.log('=== OwnerTerminationWorkflow - Request Data ===');
  if (request) {
    console.log('Request ID:', request.id);
    console.log('Status:', request.status);
    console.log('Owner Password Confirmed:', request.ownerPasswordConfirmed);
    console.log('Tenant Password Confirmed:', request.tenantPasswordConfirmed);
    console.log('Owner Signature:', !!request.ownerSignature);
    console.log('Tenant Signature:', !!request.tenantSignature);
  }
  console.log('================================================');

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

  if (!requestId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Aucune demande spécifiée</h1>
          <Button onClick={() => navigate("/dashboard")}>Retour au tableau de bord</Button>
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
          <p className="text-gray-600 mb-4">Cette demande n'existe pas ou a été supprimée.</p>
          <Button onClick={() => navigate("/dashboard")}>Retour au tableau de bord</Button>
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
            onClick={() => navigate(`/owner-termination-review/${requestId}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux détails
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Processus de validation</h1>
            <p className="text-gray-600">Contrat #{request.contractId} - Vue propriétaire</p>
          </div>
        </div>

        <ContractTerminationWorkflow
          request={request}
          currentUserType="owner"
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
}

export default OwnerTerminationWorkflow;