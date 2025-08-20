import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, XCircle, Clock, FileText, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type RequestType = 'modification' | 'termination';

interface Request {
  id: number;
  contractId: number;
  requestedBy: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  requestedChanges?: string;
  reason?: string;
  ownerResponse?: string;
  tenantResponse?: string;
}

export default function OwnerRequestResponse() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [response, setResponse] = useState('');
  
  // Parse URL to get request type and ID
  const requestType = params.type as RequestType;
  const requestId = parseInt(params.id || '0');
  
  console.log("OwnerRequestResponse: URL params:", { type: params.type, id: params.id });
  console.log("OwnerRequestResponse: Parsed values:", { requestType, requestId });

  // Get current user
  const getUserData = () => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error("Error parsing userData:", e);
        return null;
      }
    }
    return null;
  };
  
  const currentUser = getUserData();
  
  // Fetch request details
  const { data: request, isLoading, error } = useQuery<Request>({
    queryKey: [`/api/contract-${requestType}-requests/${requestId}`],
    enabled: !!requestId && !!currentUser,
    queryFn: async () => {
      console.log("OwnerRequestResponse: Making API request to", `/api/contract-${requestType}-requests/${requestId}`);
      const response = await fetch(`/api/contract-${requestType}-requests/${requestId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch request');
      }
      const data = await response.json();
      console.log("OwnerRequestResponse: Received request data", data);
      return data;
    }
  });
  
  console.log("OwnerRequestResponse: Query state:", { 
    request, 
    isLoading, 
    error,
    queryEnabled: !!requestId && !!currentUser 
  });

  // Handle response submission
  const respondMutation = useMutation({
    mutationFn: async ({ response, ownerResponse }: { response: 'accepted' | 'rejected', ownerResponse: string }) => {
      console.log("OwnerRequestResponse: Submitting response", { response, ownerResponse });
      return apiRequest(`/api/contract-${requestType}-requests/${requestId}/respond`, {
        method: 'PUT',
        body: JSON.stringify({
          response,
          ownerResponse: ownerResponse.trim(),
          userId: currentUser?.id
        })
      });
    },
    onSuccess: (data, variables) => {
      console.log("OwnerRequestResponse: Response submitted successfully", data);
      queryClient.invalidateQueries({ queryKey: [`/api/owner-requests/${currentUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contract-${requestType}-requests/${requestId}`] });
      
      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été envoyée avec succès.",
      });
      
      // If accepted a termination request, redirect to the termination workflow
      if (variables.response === 'accepted' && requestType === 'termination') {
        navigate(`/owner-termination-workflow/${requestId}`);
      } else {
        // Otherwise navigate back to contracts
        navigate('/contracts');
      }
    },
    onError: (error) => {
      console.error("OwnerRequestResponse: Error submitting response", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre réponse.",
        variant: "destructive"
      });
    }
  });

  if (!currentUser) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Non autorisé</h2>
              <p className="text-gray-600">Vous devez être connecté pour voir cette page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Clock className="mx-auto h-12 w-12 text-blue-500 mb-4 animate-spin" />
              <p>Chargement de la demande...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Demande non trouvée</h2>
              <p className="text-gray-600">Cette demande n'existe pas ou vous n'y avez pas accès.</p>
              <Button 
                onClick={() => navigate('/contracts')} 
                className="mt-4"
                data-testid="button-back-to-contracts"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux contrats
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />En attente</Badge>;
      case 'accepted':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" />Acceptée</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="mr-1 h-3 w-3" />Refusée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'termination':
        return 'Demande d\'arrêt de contrat';
      case 'modification':
        return 'Demande de modification';
      default:
        return 'Demande';
    }
  };

  const canRespond = request.status === 'pending';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/contracts')}
            data-testid="button-back-to-contracts"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{getTypeTitle(requestType)}</h1>
            <p className="text-gray-600">Réf: #{request.id}</p>
          </div>
        </div>
        {getStatusBadge(request.status)}
      </div>

      <div className="grid gap-6">
        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Détails de la demande
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Date de la demande</label>
              <p className="mt-1">{new Date(request.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            
            {request.reason && (
              <div>
                <label className="text-sm font-medium text-gray-700">Raison</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{request.reason}</p>
              </div>
            )}
            
            {request.requestedChanges && (
              <div>
                <label className="text-sm font-medium text-gray-700">Modifications demandées</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{request.requestedChanges}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Section */}
        {canRespond ? (
          <Card>
            <CardHeader>
              <CardTitle>Votre réponse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Message de réponse (optionnel)
                </label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Ajoutez des commentaires ou explications..."
                  rows={4}
                  className="mt-1"
                  data-testid="textarea-owner-response"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => respondMutation.mutate({ response: 'accepted', ownerResponse: response })}
                  disabled={respondMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-accept-request"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {respondMutation.isPending && respondMutation.variables?.response === 'accepted' ? 'Acceptation...' : 'Accepter'}
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => respondMutation.mutate({ response: 'rejected', ownerResponse: response })}
                  disabled={respondMutation.isPending}
                  data-testid="button-reject-request"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {respondMutation.isPending && respondMutation.variables?.response === 'rejected' ? 'Refus...' : 'Refuser'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Réponse</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusBadge(request.status)}
                  <span className="text-sm text-gray-600">
                    {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                
                {request.ownerResponse && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Votre message :</p>
                    <p className="mt-1 text-gray-900">{request.ownerResponse}</p>
                  </div>
                )}
                
                {request.tenantResponse && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Réponse du locataire :</p>
                    <p className="mt-1 text-gray-900">{request.tenantResponse}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}