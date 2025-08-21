import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Clock, User, FileSignature, Shield, AlertCircle } from "lucide-react";
import type { ContractTerminationRequest } from "@shared/schema";

interface TerminationStepsProgressProps {
  request: ContractTerminationRequest;
  userRole: 'tenant' | 'owner';
  userId: number;
  onStepAction?: (step: string, action: string) => void;
}

export function TerminationStepsProgress({ 
  request, 
  userRole, 
  userId, 
  onStepAction 
}: TerminationStepsProgressProps) {
  
  const steps = [
    {
      id: 'request_created',
      title: 'Demande créée',
      description: 'La demande d\'arrêt a été soumise',
      icon: FileSignature,
      completed: true, // Always completed if request exists
      activeUser: request.requestedBy === userId ? userRole : (userRole === 'tenant' ? 'owner' : 'tenant'),
      canAct: false
    },
    {
      id: 'response',
      title: 'Réponse à la demande',
      description: userRole === 'tenant' 
        ? (request.requestedBy === userId ? 'En attente de la réponse du propriétaire' : 'Accepter ou refuser la demande')
        : (request.requestedBy === userId ? 'En attente de la réponse du locataire' : 'Accepter ou refuser la demande'),
      icon: User,
      completed: request.status === 'accepted' || request.status === 'rejected',
      activeUser: request.requestedBy === userId ? (userRole === 'tenant' ? 'owner' : 'tenant') : userRole,
      canAct: request.status === 'pending' && request.requestedBy !== userId
    },
    {
      id: 'owner_password',
      title: 'Confirmation propriétaire',
      description: 'Confirmation par mot de passe du propriétaire',
      icon: Shield,
      completed: request.ownerPasswordConfirmed || false,
      activeUser: 'owner',
      canAct: userRole === 'owner' && request.status === 'accepted' && !request.ownerPasswordConfirmed
    },
    {
      id: 'tenant_password', 
      title: 'Confirmation locataire',
      description: 'Confirmation par mot de passe du locataire',
      icon: Shield,
      completed: request.tenantPasswordConfirmed || false,
      activeUser: 'tenant',
      canAct: userRole === 'tenant' && request.status === 'accepted' && request.ownerPasswordConfirmed && !request.tenantPasswordConfirmed
    },
    {
      id: 'signatures',
      title: 'Signatures électroniques',
      description: 'Signatures des deux parties',
      icon: FileSignature,
      completed: request.ownerSignature && request.tenantSignature,
      activeUser: 'both',
      canAct: request.status === 'accepted' && request.ownerPasswordConfirmed && request.tenantPasswordConfirmed && (!request.ownerSignature || !request.tenantSignature)
    }
  ];

  const getStepStatus = (step: typeof steps[0]) => {
    if (step.completed) return 'completed';
    if (step.canAct && step.activeUser === userRole) return 'active';
    if (step.activeUser === userRole || step.activeUser === 'both') return 'pending';
    return 'waiting';
  };

  const getStepIcon = (step: typeof steps[0]) => {
    const status = getStepStatus(step);
    const IconComponent = step.icon;
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'active':
        return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepBadge = (step: typeof steps[0]) => {
    const status = getStepStatus(step);
    
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Terminé</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 animate-pulse">À votre tour</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-500">En attente</Badge>;
    }
  };

  const handleStepAction = (stepId: string) => {
    if (onStepAction) {
      onStepAction(stepId, 'proceed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSignature className="mr-2 h-5 w-5" />
          Étapes de validation de l'arrêt
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(step);
            
            return (
              <div key={step.id} className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  {getStepIcon(step)}
                  {index < steps.length - 1 && (
                    <div className={`w-0.5 h-12 mt-2 ${
                      step.completed ? 'bg-green-200' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {step.title}
                      </h3>
                      {getStepBadge(step)}
                    </div>
                    
                    {step.canAct && status === 'active' && (
                      <Button 
                        size="sm"
                        onClick={() => handleStepAction(step.id)}
                        data-testid={`button-step-${step.id}`}
                      >
                        {step.id === 'response' ? 'Répondre' : 
                         step.id.includes('password') ? 'Confirmer' : 'Signer'}
                      </Button>
                    )}
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-600">
                    {step.description}
                  </p>
                  
                  {status === 'active' && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      👆 Action requise de votre part
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                Processus de validation
              </h4>
              <p className="mt-1 text-sm text-blue-700">
                Toutes les étapes doivent être complétées par les deux parties avant que l'arrêt du contrat soit effectif. 
                Chaque utilisateur ne peut procéder qu'avec ses propres étapes.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}