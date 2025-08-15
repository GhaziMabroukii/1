import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TerminationRequest {
  id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'signed' | 'completed';
  ownerPasswordConfirmed: boolean;
  tenantPasswordConfirmed: boolean;
  ownerSignature?: string;
  tenantSignature?: string;
  ownerConfirmedAt?: string;
  tenantConfirmedAt?: string;
  ownerSignedAt?: string;
  tenantSignedAt?: string;
  createdAt?: string;
}

interface ContractTerminationProgressProps {
  request: TerminationRequest;
  currentUserType: 'owner' | 'tenant';
}

interface ProgressStep {
  id: string;
  title: string;
  completed: boolean;
  current?: boolean;
  date?: string;
}

export function ContractTerminationProgress({ request, currentUserType }: ContractTerminationProgressProps) {
  
  const getProgressSteps = (): ProgressStep[] => {
    const steps: ProgressStep[] = [
      {
        id: 'created',
        title: 'Demande créée',
        completed: true,
        date: request ? new Date(request.createdAt || '').toLocaleDateString('fr-FR') : undefined
      },
      {
        id: 'owner_confirmation',
        title: 'Confirmation propriétaire',
        completed: request?.ownerPasswordConfirmed || false,
        date: request?.ownerConfirmedAt ? new Date(request.ownerConfirmedAt).toLocaleDateString('fr-FR') : undefined
      },
      {
        id: 'tenant_confirmation', 
        title: 'Confirmation locataire',
        completed: request?.tenantPasswordConfirmed || false,
        date: request?.tenantConfirmedAt ? new Date(request.tenantConfirmedAt).toLocaleDateString('fr-FR') : undefined
      },
      {
        id: 'owner_signature',
        title: 'Signature propriétaire',
        completed: !!request?.ownerSignature,
        date: request?.ownerSignedAt ? new Date(request.ownerSignedAt).toLocaleDateString('fr-FR') : undefined
      },
      {
        id: 'tenant_signature',
        title: 'Signature locataire',
        completed: !!request?.tenantSignature,
        date: request?.tenantSignedAt ? new Date(request.tenantSignedAt).toLocaleDateString('fr-FR') : undefined
      }
    ];

    // Determine current step
    const firstIncompleteIndex = steps.findIndex(step => !step.completed);
    if (firstIncompleteIndex !== -1) {
      steps[firstIncompleteIndex].current = true;
    }

    return steps;
  };

  const steps = getProgressSteps();
  const allStepsCompleted = steps.every(step => step.completed);
  const currentStep = steps.find(step => step.current);

  const getStepIcon = (step: ProgressStep) => {
    if (step.completed) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (step.current) {
      return <Clock className="w-5 h-5 text-blue-600" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStatus = (step: ProgressStep) => {
    if (step.completed) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Terminé</Badge>;
    } else if (step.current) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">En cours</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600">En attente</Badge>;
    }
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Processus d'arrêt de contrat</h3>
        <p className="text-sm text-gray-600">
          {allStepsCompleted ? 
            'Toutes les étapes sont terminées. Le contrat sera résilié.' :
            currentStep ? 
              `Étape actuelle: ${currentStep.title}` :
              'Processus d\'arrêt en cours'
          }
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {getStepIcon(step)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <p className={`text-sm font-medium ${
                    step.completed ? 'text-gray-900' : 
                    step.current ? 'text-blue-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  {getStepStatus(step)}
                </div>
                
                {step.date && (
                  <p className="text-xs text-gray-500">{step.date}</p>
                )}
              </div>

              {/* Progress line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="ml-2.5 mt-2 h-6 w-px bg-gray-200"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {allStepsCompleted && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-sm font-medium text-green-800">
              Processus terminé - Le contrat sera officiellement résilié
            </p>
          </div>
        </div>
      )}

      {!allStepsCompleted && currentStep && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                En attente: {currentStep.title}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {currentStep.id.includes('confirmation') && 
                  'Veuillez confirmer avec votre mot de passe pour continuer'}
                {currentStep.id.includes('signature') && 
                  'Veuillez signer numériquement pour finaliser'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}