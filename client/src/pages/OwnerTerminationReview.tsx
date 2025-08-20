import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock, FileText } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TerminationRequest {
  id: number;
  contractId: number;
  requestedBy: number;
  reason: string;
  detailedReason: string;
  terminationType: string;
  proposedTerms: {
    timeline?: string;
    financialTerms?: string;
    depositHandling?: string;
    additionalConditions?: string;
  };
  status: string;
  ownerResponse?: string;
  tenantResponse?: string;
  createdAt: string;
  respondedAt?: string;
}

export function OwnerTerminationReview() {
  const [match, params] = useRoute("/owner-termination-review/:requestId");
  const requestId = params?.requestId;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [ownerResponse, setOwnerResponse] = useState('');
  const [isAccepting, setIsAccepting] = useState<boolean | null>(null);

  // Fetch termination request details
  const { data: request, isLoading } = useQuery<TerminationRequest>({
    queryKey: [`/api/contract-termination-requests/${requestId}`],
    enabled: !!requestId
  });

  // Fetch contract details
  const { data: contract } = useQuery({
    queryKey: [`/api/contracts/${request?.contractId}`],
    enabled: !!request?.contractId
  });

  // Fetch tenant details
  const { data: tenant } = useQuery({
    queryKey: [`/api/users/${request?.requestedBy}`],
    enabled: !!request?.requestedBy
  });

  const respondMutation = useMutation({
    mutationFn: async (data: { response: 'accepted' | 'rejected', ownerResponse: string }) => {
      return apiRequest(`/api/contract-termination-requests/${requestId}/respond`, {
        method: 'PUT',
        body: JSON.stringify({
          ...data,
          userId: JSON.parse(localStorage.getItem('currentUser') || '{}').id
        })
      });
    },
    onSuccess: (data, variables) => {
      const action = variables.response === 'accepted' ? 'acceptée' : 'rejetée';
      toast({
        title: `Demande ${action}`,
        description: `La demande d'arrêt de contrat a été ${action}. Le locataire en sera notifié.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/contract-termination-requests/${requestId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/owner-requests`] });
      
      if (variables.response === 'accepted') {
        navigate(`/owner-termination-workflow/${requestId}`);
      } else {
        navigate('/');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter la demande",
        variant: "destructive"
      });
    }
  });

  const handleResponse = (accepted: boolean) => {
    if (!ownerResponse.trim() && !accepted) {
      toast({
        title: "Réponse requise",
        description: "Veuillez expliquer pourquoi vous rejetez cette demande",
        variant: "destructive"
      });
      return;
    }

    respondMutation.mutate({
      response: accepted ? 'accepted' : 'rejected',
      ownerResponse: ownerResponse.trim()
    });
  };

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

  const getTerminationTypeLabel = (type: string) => {
    switch(type) {
      case 'early_by_tenant': return 'Résiliation anticipée par locataire';
      case 'mutual': return 'Résiliation à l\'amiable';
      case 'dispute': return 'Résiliation pour litige';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">En attente</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Acceptée</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejetée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">Demande d'arrêt de contrat</h1>
            {getStatusBadge(request.status)}
          </div>
        </div>

        <div className="grid gap-6">
          {/* Request Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Détails de la demande
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Demandée par</p>
                  <p className="font-semibold">{tenant?.firstName && tenant?.lastName ? `${tenant.firstName} ${tenant.lastName}` : 'Locataire'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Date de demande</p>
                  <p>{format(new Date(request.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Type de résiliation</p>
                  <p className="font-semibold">{getTerminationTypeLabel(request.terminationType)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Contrat concerné</p>
                  <p className="font-semibold">#{request.contractId}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Raison principale</p>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{request.reason}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Explication détaillée</p>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{request.detailedReason}</p>
              </div>
            </CardContent>
          </Card>

          {/* Proposed Terms */}
          {request.proposedTerms && (
            <Card>
              <CardHeader>
                <CardTitle>Conditions proposées par le locataire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {request.proposedTerms.timeline && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Délai souhaité</p>
                      <p>{request.proposedTerms.timeline}</p>
                    </div>
                  )}
                  {request.proposedTerms.financialTerms && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conditions financières</p>
                      <p>{request.proposedTerms.financialTerms}</p>
                    </div>
                  )}
                  {request.proposedTerms.depositHandling && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gestion de la caution</p>
                      <p>{request.proposedTerms.depositHandling}</p>
                    </div>
                  )}
                  {request.proposedTerms.additionalConditions && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-600">Conditions supplémentaires</p>
                      <p className="mt-1 p-3 bg-gray-50 rounded-lg">{request.proposedTerms.additionalConditions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Section - Only show if pending */}
          {request.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Votre réponse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Décision importante
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Si vous acceptez cette demande, vous devrez tous les deux compléter le processus de validation (confirmation par mot de passe et signature numérique) avant que le contrat soit officiellement résilié.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ownerResponse">Votre réponse (optionnelle si acceptation, requise si refus)</Label>
                  <Textarea
                    id="ownerResponse"
                    value={ownerResponse}
                    onChange={(e) => setOwnerResponse(e.target.value)}
                    placeholder="Expliquez votre décision, proposez des modifications aux conditions, ou donnez des informations supplémentaires..."
                    rows={4}
                    data-testid="textarea-owner-response"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={() => handleResponse(false)}
                    disabled={respondMutation.isPending}
                    data-testid="button-reject-request"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Refuser la demande
                  </Button>
                  <Button
                    onClick={() => handleResponse(true)}
                    disabled={respondMutation.isPending}
                    data-testid="button-accept-request"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accepter et continuer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Already responded */}
          {request.status !== 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Votre réponse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    {request.status === 'accepted' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-semibold">
                      Demande {request.status === 'accepted' ? 'acceptée' : 'rejetée'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {request.respondedAt ? format(new Date(request.respondedAt), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Date non disponible'}
                  </p>
                  {request.ownerResponse && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Votre commentaire :</p>
                      <p className="mt-1">{request.ownerResponse}</p>
                    </div>
                  )}
                </div>

                {request.status === 'accepted' && (
                  <div className="mt-4">
                    <Button 
                      onClick={() => navigate(`/owner-termination-workflow/${requestId}`)}
                      data-testid="button-continue-workflow"
                    >
                      Continuer le processus de validation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerTerminationReview;