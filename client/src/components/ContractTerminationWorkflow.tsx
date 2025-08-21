import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Lock, PenTool } from 'lucide-react';
import { ContractTerminationProgress } from './ContractTerminationProgress';
import SignatureCanvas from 'react-signature-canvas';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TerminationRequest {
  id: number;
  contractId: number;
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

interface ContractTerminationWorkflowProps {
  request: TerminationRequest;
  currentUserType: 'owner' | 'tenant';
  currentUserId: number;
}

export function ContractTerminationWorkflow({ 
  request, 
  currentUserType, 
  currentUserId 
}: ContractTerminationWorkflowProps) {
  const [password, setPassword] = useState('');
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('ContractTerminationWorkflow Debug:', {
    requestId: request.id,
    currentUserType,
    requestStatus: request.status,
    ownerPasswordConfirmed: request.ownerPasswordConfirmed,
    tenantPasswordConfirmed: request.tenantPasswordConfirmed,
    ownerSignature: !!request.ownerSignature,
    tenantSignature: !!request.tenantSignature,
    needsPasswordConfirmation: currentUserType === 'owner' ? !request.ownerPasswordConfirmed : !request.tenantPasswordConfirmed,
    needsSignature: currentUserType === 'owner' ? !request.ownerSignature && request.ownerPasswordConfirmed : !request.tenantSignature && request.tenantPasswordConfirmed,
    canConfirmPassword: request.status === 'accepted' && (currentUserType === 'owner' ? !request.ownerPasswordConfirmed : !request.tenantPasswordConfirmed),
    canSign: request.status === 'accepted' && (currentUserType === 'owner' ? !request.ownerSignature && request.ownerPasswordConfirmed : !request.tenantSignature && request.tenantPasswordConfirmed)
  });

  // Check what step the current user needs to complete
  const needsPasswordConfirmation = currentUserType === 'owner' ? 
    !request.ownerPasswordConfirmed : !request.tenantPasswordConfirmed;
  
  const needsSignature = currentUserType === 'owner' ?
    !request.ownerSignature && request.ownerPasswordConfirmed :
    !request.tenantSignature && request.tenantPasswordConfirmed;

  const canConfirmPassword = request.status === 'accepted' && needsPasswordConfirmation;
  const canSign = request.status === 'accepted' && needsSignature;
  
  // Password confirmation mutation
  const confirmPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      return apiRequest(`/api/contracts/${request.contractId}/confirm-termination-password`, {
        method: 'POST',
        body: JSON.stringify({
          password,
          userType: currentUserType
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Mot de passe confirmé",
        description: "Vous pouvez maintenant procéder à la signature numérique.",
      });
      setPassword('');
      queryClient.invalidateQueries({ queryKey: [`/api/contract-termination-requests/${request.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${request.contractId}/termination-request`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Mot de passe incorrect",
        variant: "destructive"
      });
    }
  });

  // Signature submission mutation
  const submitSignatureMutation = useMutation({
    mutationFn: async (signature: string) => {
      return apiRequest(`/api/contracts/${request.contractId}/submit-termination-signature`, {
        method: 'POST',
        body: JSON.stringify({
          signature,
          userType: currentUserType
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Signature enregistrée",
        description: "Votre signature a été enregistrée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/contract-termination-requests/${request.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${request.contractId}/termination-request`] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement de la signature",
        variant: "destructive"
      });
    }
  });

  const handlePasswordConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      confirmPasswordMutation.mutate(password);
    }
  };

  const handleSignatureSubmit = () => {
    if (signatureRef && !signatureRef.isEmpty()) {
      const signatureData = signatureRef.toDataURL();
      submitSignatureMutation.mutate(signatureData);
    } else {
      toast({
        title: "Signature requise",
        description: "Veuillez signer avant de soumettre.",
        variant: "destructive"
      });
    }
  };

  const clearSignature = () => {
    if (signatureRef) {
      signatureRef.clear();
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Tracker */}
      <ContractTerminationProgress 
        request={request} 
        currentUserType={currentUserType}
      />

      {/* Password Confirmation Step */}
      {canConfirmPassword && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="mr-2 h-5 w-5" />
              Confirmation par mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Confirmation de sécurité requise
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Veuillez saisir votre mot de passe pour confirmer votre accord à l'arrêt du contrat.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordConfirm} className="space-y-4">
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe"
                    required
                    data-testid="input-password-confirm"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={confirmPasswordMutation.isPending || !password.trim()}
                  data-testid="button-confirm-password"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {confirmPasswordMutation.isPending ? 'Vérification...' : 'Confirmer avec mot de passe'}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Digital Signature Step */}
      {canSign && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PenTool className="mr-2 h-5 w-5" />
              Signature numérique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Prêt pour la signature
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Votre mot de passe a été confirmé. Veuillez maintenant signer numériquement pour finaliser l'arrêt du contrat.
                  </p>
                </div>
              </div>

              <div>
                <Label>Votre signature</Label>
                <div className="mt-2 border-2 border-gray-300 rounded-lg">
                  <SignatureCanvas
                    ref={(ref) => setSignatureRef(ref)}
                    canvasProps={{
                      className: 'w-full h-40 rounded-lg',
                      style: { width: '100%', height: '160px' }
                    }}
                    backgroundColor="white"
                    data-testid="signature-canvas"
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSignature}
                    data-testid="button-clear-signature"
                  >
                    Effacer
                  </Button>
                  <Button 
                    onClick={handleSignatureSubmit}
                    disabled={submitSignatureMutation.isPending}
                    data-testid="button-submit-signature"
                  >
                    <PenTool className="mr-2 h-4 w-4" />
                    {submitSignatureMutation.isPending ? 'Enregistrement...' : 'Enregistrer la signature'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {request.status === 'completed' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Contrat résilié avec succès</h3>
                <p className="text-sm text-gray-600">
                  Toutes les étapes ont été complétées. Le contrat est officiellement résilié.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiting for Other Party */}
      {!canConfirmPassword && !canSign && request.status !== 'completed' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-blue-600">
              <AlertCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">En attente</h3>
                <p className="text-sm text-gray-600">
                  En attente de l'action de l'autre partie pour continuer le processus d'arrêt.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}