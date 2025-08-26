import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, Clock, XCircle, Users, FileSignature, Key } from 'lucide-react';
import { useLocation } from 'wouter';

interface TerminationRequest {
  id: number;
  contractId: number;
  requestedBy: number;
  status: string;
  reason: string;
  detailedReason?: string;
  terminationType: string;
  proposedTerms?: string;
  ownerPasswordConfirmed: boolean;
  tenantPasswordConfirmed: boolean;
  ownerSignature: string | null;
  tenantSignature: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Contract {
  id: number;
  ownerId: number;
  tenantId: number;
  propertyId: number;
  status: string;
}

export default function ContractTerminationStatus() {
  const { requestId } = useParams();
  const [, navigate] = useLocation();

  const { data: request, isLoading: requestLoading } = useQuery<TerminationRequest>({
    queryKey: [`/api/contract-termination-requests/${requestId}`],
    enabled: !!requestId
  });

  const { data: contract, isLoading: contractLoading } = useQuery<Contract>({
    queryKey: [`/api/contracts/${request?.contractId}`],
    enabled: !!request?.contractId
  });

  if (requestLoading || contractLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-500" />
              <p>Chargement de l'état de la demande...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <XCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p>Demande de résiliation non trouvée</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/contract-termination')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate progress based on completed steps
  const steps = [
    { label: 'Demande créée', completed: true, icon: CheckCircle },
    { 
      label: 'Confirmation propriétaire', 
      completed: request.ownerPasswordConfirmed,
      icon: request.ownerPasswordConfirmed ? CheckCircle : Clock
    },
    { 
      label: 'Confirmation locataire', 
      completed: request.tenantPasswordConfirmed,
      icon: request.tenantPasswordConfirmed ? CheckCircle : Clock
    },
    { 
      label: 'Signature propriétaire', 
      completed: !!request.ownerSignature,
      icon: request.ownerSignature ? CheckCircle : Clock
    },
    { 
      label: 'Signature locataire', 
      completed: !!request.tenantSignature,
      icon: request.tenantSignature ? CheckCircle : Clock
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progress = (completedSteps / steps.length) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'rejected': return 'bg-red-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'accepted': return 'Acceptée';
      case 'rejected': return 'Refusée';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">État de la demande de résiliation</h1>
        <p className="text-gray-600">Demande #{request.id} • Contrat #{request.contractId}</p>
      </div>

      {/* Status Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Statut général</span>
            <Badge className={getStatusColor(request.status)}>
              {getStatusText(request.status)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Progression du processus de résiliation en 5 étapes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{completedSteps}/{steps.length} étapes complétées</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Steps Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSignature className="h-5 w-5 mr-2" />
            Étapes de validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = !step.completed && (index === 0 || steps[index - 1].completed);
              
              return (
                <div 
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg border ${
                    step.completed 
                      ? 'bg-green-50 border-green-200' 
                      : isActive 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Icon 
                    className={`h-5 w-5 ${
                      step.completed 
                        ? 'text-green-500' 
                        : isActive 
                          ? 'text-blue-500' 
                          : 'text-gray-400'
                    }`} 
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${
                      step.completed 
                        ? 'text-green-900' 
                        : isActive 
                          ? 'text-blue-900' 
                          : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {step.completed && (
                      <p className="text-sm text-green-600">✓ Complétée</p>
                    )}
                    {isActive && !step.completed && (
                      <p className="text-sm text-blue-600">En cours...</p>
                    )}
                  </div>
                  {step.completed && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      OK
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Request Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Détails de la demande
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Informations générales</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Type de résiliation:</span>
                  <span className="ml-2 font-medium">{request.terminationType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Raison:</span>
                  <span className="ml-2 font-medium">{request.reason}</span>
                </div>
                {request.detailedReason && (
                  <div>
                    <span className="text-gray-600">Détails:</span>
                    <p className="ml-2 text-gray-800 mt-1">{request.detailedReason}</p>
                  </div>
                )}
                {request.proposedTerms && (
                  <div>
                    <span className="text-gray-600">Conditions proposées:</span>
                    <p className="ml-2 text-gray-800 mt-1">{request.proposedTerms}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Dates importantes</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Demande créée:</span>
                  <span className="ml-2 font-medium">
                    {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Dernière mise à jour:</span>
                  <span className="ml-2 font-medium">
                    {new Date(request.updatedAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {request.status === 'pending' && (
        <div className="mt-6 flex gap-4">
          <Button 
            onClick={() => navigate(`/contract/${request.contractId}`)}
            variant="outline"
          >
            Voir le contrat
          </Button>
          {contract && (
            <>
              {/* Show different actions based on user role and current step */}
              {!request.ownerPasswordConfirmed && (
                <Button onClick={() => navigate(`/owner-termination-review/${request.id}`)}>
                  <Key className="h-4 w-4 mr-2" />
                  Confirmer (Propriétaire)
                </Button>
              )}
              {request.ownerPasswordConfirmed && !request.tenantPasswordConfirmed && (
                <Button onClick={() => navigate(`/tenant-request-response/${request.id}`)}>
                  <Key className="h-4 w-4 mr-2" />
                  Confirmer (Locataire)
                </Button>
              )}
              {request.ownerPasswordConfirmed && request.tenantPasswordConfirmed && !request.ownerSignature && (
                <Button onClick={() => navigate(`/owner-termination-workflow/${request.id}`)}>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Signer (Propriétaire)
                </Button>
              )}
              {request.ownerSignature && !request.tenantSignature && (
                <Button onClick={() => navigate(`/tenant-termination-workflow/${request.id}`)}>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Signer (Locataire)
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}