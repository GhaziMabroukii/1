import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
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
  tenantResponse?: string;
}

export default function TenantRequestResponse() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [response, setResponse] = useState('');
  
  // Parse URL to get request type and ID
  const requestType = params.type as RequestType;
  const requestId = parseInt(params.id || '0');
  
  console.log("TenantRequestResponse: URL params:", { type: params.type, id: params.id });
  console.log("TenantRequestResponse: Parsed values:", { requestType, requestId });

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
      console.log("TenantRequestResponse: Making API request to", `/api/contract-${requestType}-requests/${requestId}`);
      const response = await fetch(`/api/contract-${requestType}-requests/${requestId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch request');
      }
      const data = await response.json();
      console.log("TenantRequestResponse: Received request data", data);
      return data;
    }
  });
  
  console.log("TenantRequestResponse: Query state:", { 
    request, 
    isLoading, 
    error, 
    enabled: !!requestId && !!currentUser,
    queryKey: `/api/contract-${requestType}-requests/${requestId}`
  });

  // Fetch contract details
  const { data: contract } = useQuery<any>({
    queryKey: [`/api/contracts/${request?.contractId}`],
    enabled: !!request?.contractId
  });

  // Response mutation
  const responseMutation = useMutation({
    mutationFn: async (responseType: 'accepted' | 'rejected') => {
      return apiRequest(`/api/contract-${requestType}-requests/${requestId}/respond`, {
        method: 'PUT',
        body: JSON.stringify({
          response: responseType,
          tenantResponse: response,
          userId: currentUser?.id
        })
      });
    },
    onSuccess: (data, responseType) => {
      toast({
        title: responseType === 'accepted' ? "Demande acceptée" : "Demande refusée",
        description: responseType === 'accepted' 
          ? "Votre acceptation a été envoyée au propriétaire"
          : "Votre refus a été envoyé au propriétaire"
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [`/api/contract-${requestType}-requests/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      // Navigate back to contracts or dashboard
      navigate('/contracts');
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter votre réponse",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="text-center">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Card>
            <CardContent className="text-center p-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Demande non trouvée</h2>
              <p className="text-gray-600">Cette demande n'existe pas ou a été supprimée.</p>
              <Button onClick={() => navigate('/contracts')} className="mt-4">
                Retour aux contrats
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" /> En attente
        </Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" /> Acceptée
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <XCircle className="w-3 h-3 mr-1" /> Refusée
        </Badge>;
      default:
        return null;
    }
  };

  const isModificationRequest = requestType === 'modification';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <div className="max-w-2xl mx-auto pt-20">
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="h-6 w-6 text-orange-600" />
              <CardTitle className="text-2xl text-gray-800">
                {isModificationRequest ? 'Demande de Modification' : 'Demande d\'Arrêt Anticipé'}
              </CardTitle>
            </div>
            {getStatusBadge(request.status)}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Contract Info */}
            {contract && contract.contractData && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Informations du Contrat</h3>
                <p className="text-gray-600">
                  <strong>Propriété:</strong> {contract.contractData.propertyTitle}
                </p>
                <p className="text-gray-600">
                  <strong>Adresse:</strong> {contract.contractData.propertyAddress}
                </p>
                <p className="text-gray-600">
                  <strong>Loyer:</strong> {contract.contractData.monthlyRent} DT/mois
                </p>
              </div>
            )}

            {/* Request Details */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 text-blue-800">
                Détails de la Demande
              </h3>
              <p className="text-blue-700 mb-2">
                <strong>Date de demande:</strong> {request?.createdAt ? new Date(request.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
              </p>
              {isModificationRequest && request?.requestedChanges && (
                <p className="text-blue-700">
                  <strong>Modifications demandées:</strong> {request.requestedChanges}
                </p>
              )}
              {!isModificationRequest && request?.reason && (
                <p className="text-blue-700">
                  <strong>Raison:</strong> {request.reason}
                </p>
              )}
            </div>

            {/* Response Section */}
            {request?.status === 'pending' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Votre réponse (optionnelle)
                  </label>
                  <Textarea
                    placeholder="Ajoutez un commentaire..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="w-full"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => responseMutation.mutate('accepted')}
                    disabled={responseMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accepter
                  </Button>
                  <Button
                    onClick={() => responseMutation.mutate('rejected')}
                    disabled={responseMutation.isPending}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Refuser
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Réponse donnée</h3>
                <p className="text-gray-600">
                  <strong>Statut:</strong> {request?.status === 'accepted' ? 'Acceptée' : 'Refusée'}
                </p>
                {request?.tenantResponse && (
                  <p className="text-gray-600 mt-2">
                    <strong>Commentaire:</strong> {request.tenantResponse}
                  </p>
                )}
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={() => navigate('/contracts')}
                variant="outline"
                className="w-full"
              >
                Retour aux contrats
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}