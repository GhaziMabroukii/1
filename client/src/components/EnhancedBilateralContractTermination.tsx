import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Shield, UserCheck, Clock, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ErrorAlert } from '@/components/ErrorAlert';
import SignatureCanvas from 'react-signature-canvas';
import Swal from 'sweetalert2';

interface BilateralTerminationProps {
  contract: any;
  currentUserId: number;
  userType: 'tenant' | 'owner';
}

interface TerminationRequest {
  id: number;
  contractId: number;
  requestedBy: number;
  reason: string;
  detailedReason?: string;
  terminationType: 'mutual' | 'early_by_owner' | 'early_by_tenant' | 'dispute';
  proposedTerms: {
    financialTerms: string;
    timeline: string;
    depositHandling: string;
    rentRefund?: string;
    additionalConditions?: string;
  };
  status: 'pending' | 'negotiating' | 'accepted' | 'rejected' | 'signed' | 'completed';
  tenantResponse?: string;
  ownerResponse?: string;
  ownerPasswordConfirmed: boolean;
  tenantPasswordConfirmed: boolean;
  ownerSignature?: string;
  tenantSignature?: string;
  ownerSignedAt?: string;
  tenantSignedAt?: string;
  terminationDocumentUrl?: string;
  finalTerms?: any;
  createdAt: string;
  updatedAt: string;
}

export function EnhancedBilateralContractTermination({ contract, currentUserId, userType }: BilateralTerminationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  console.log('EnhancedBilateralContractTermination - Props:', {
    contractId: contract?.id,
    currentUserId,
    userType,
    currentUserIdType: typeof currentUserId
  });
  
  // Form states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showSigningDialog, setShowSigningDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Termination request form
  const [reason, setReason] = useState('');
  const [detailedReason, setDetailedReason] = useState('');
  const [terminationType, setTerminationType] = useState<'mutual' | 'early_by_owner' | 'early_by_tenant' | 'dispute'>('mutual');
  const [financialTerms, setFinancialTerms] = useState('');
  const [timeline, setTimeline] = useState('');
  const [depositHandling, setDepositHandling] = useState('');
  const [rentRefund, setRentRefund] = useState('');
  const [additionalConditions, setAdditionalConditions] = useState('');
  
  // Response form
  const [responseMessage, setResponseMessage] = useState('');
  const [counterProposal, setCounterProposal] = useState('');
  
  // Signature
  const [signatureCanvas, setSignatureCanvas] = useState<SignatureCanvas | null>(null);
  const [currentRequestForAction, setCurrentRequestForAction] = useState<TerminationRequest | null>(null);
  
  // Fetch termination requests
  const { data: terminationRequest, isLoading } = useQuery<TerminationRequest | null>({
    queryKey: [`/api/contracts/${contract.id}/termination-request`],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contract.id}/termination-request`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!contract.id,
  });

  // Create termination request
  const createTerminationMutation = useMutation({
    mutationFn: async () => {
      const proposedTerms = {
        financialTerms: financialTerms.trim(),
        timeline: timeline.trim(),
        depositHandling: depositHandling.trim(),
        rentRefund: rentRefund.trim(),
        additionalConditions: additionalConditions.trim(),
      };

      return apiRequest(`/api/contracts/${contract.id}/create-termination-request`, {
        method: 'POST',
        body: JSON.stringify({
          requestedBy: currentUserId,
          reason: reason.trim(),
          detailedReason: detailedReason.trim(),
          terminationType,
          proposedTerms,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Demande créée",
        description: "Votre demande d'arrêt de contrat a été créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contract.id}/termination-request`] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      setError(error.message || "Erreur lors de la création de la demande");
    },
  });

  // Confirm with password
  const confirmPasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/contracts/${contract.id}/confirm-termination-password`, {
        method: 'POST',
        body: JSON.stringify({
          password: password.trim(),
          userType,
        }),
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Confirmation réussie",
        description: "Votre mot de passe a été confirmé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contract.id}/termination-request`] });
      setShowPasswordDialog(false);
      setPassword('');
      
      // Check if termination is completed and show success popup
      if (response?.terminationCompleted) {
        setTimeout(() => {
          if (userType === 'owner') {
            Swal.fire({
              icon: 'success',
              title: '🎉 Contrat arrêté avec succès!',
              html: `
                <div style="text-align: left; margin: 20px 0;">
                  <p><strong>✅ Le contrat a été officiellement arrêté</strong></p>
                  <p><strong>🏠 Votre bien est maintenant retourné disponible</strong></p>
                  <p><strong>📋 Tous les détails sont disponibles dans</strong> <code>/contracts</code></p>
                  <p><strong>📄 Les détails d'arrêt sont accessibles au public</strong></p>
                </div>
              `,
              confirmButtonText: 'Parfait!',
              confirmButtonColor: '#10b981',
              showClass: {
                popup: 'animate__animated animate__fadeInDown'
              },
              hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
              }
            });
          } else {
            Swal.fire({
              icon: 'success',
              title: '🎉 Contrat arrêté avec succès!',
              html: `
                <div style="text-align: left; margin: 20px 0;">
                  <p><strong>✅ Le contrat a été officiellement arrêté</strong></p>
                  <p><strong>📋 Tous les détails sont disponibles dans</strong> <code>/contracts</code></p>
                  <p><strong>📄 Vous pouvez consulter les détails d'arrêt</strong></p>
                </div>
              `,
              confirmButtonText: 'Parfait!',
              confirmButtonColor: '#10b981',
              showClass: {
                popup: 'animate__animated animate__fadeInDown'
              },
              hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
              }
            });
          }
        }, 1000);
      }
    },
    onError: (error: any) => {
      setError(error.message || "Mot de passe incorrect");
    },
  });

  // Submit digital signature
  const submitSignatureMutation = useMutation({
    mutationFn: async () => {
      if (!signatureCanvas) throw new Error('Signature requise');
      
      const signatureData = signatureCanvas.toDataURL();
      return apiRequest(`/api/contracts/${contract.id}/submit-termination-signature`, {
        method: 'POST',
        body: JSON.stringify({
          signature: signatureData,
          userType,
        }),
      });
    },
    onSuccess: (response: any) => {
      toast({
        title: "Signature enregistrée",
        description: "Votre signature a été enregistrée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contract.id}/termination-request`] });
      setShowSigningDialog(false);
      if (signatureCanvas) signatureCanvas.clear();
      
      // Check if termination is completed and show success popup
      if (response?.terminationCompleted) {
        setTimeout(() => {
          if (userType === 'owner') {
            Swal.fire({
              icon: 'success',
              title: '🎉 Contrat arrêté avec succès!',
              html: `
                <div style="text-align: left; margin: 20px 0;">
                  <p><strong>✅ Le contrat a été officiellement arrêté</strong></p>
                  <p><strong>🏠 Votre bien est maintenant retourné disponible</strong></p>
                  <p><strong>📋 Tous les détails sont disponibles dans</strong> <code>/contracts</code></p>
                  <p><strong>📄 Les détails d'arrêt sont accessibles au public</strong></p>
                </div>
              `,
              confirmButtonText: 'Parfait!',
              confirmButtonColor: '#10b981',
              showClass: {
                popup: 'animate__animated animate__fadeInDown'
              },
              hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
              }
            });
          } else {
            Swal.fire({
              icon: 'success',
              title: '🎉 Contrat arrêté avec succès!',
              html: `
                <div style="text-align: left; margin: 20px 0;">
                  <p><strong>✅ Le contrat a été officiellement arrêté</strong></p>
                  <p><strong>📋 Tous les détails sont disponibles dans</strong> <code>/contracts</code></p>
                  <p><strong>📄 Vous pouvez consulter les détails d'arrêt</strong></p>
                </div>
              `,
              confirmButtonText: 'Parfait!',
              confirmButtonColor: '#10b981',
              showClass: {
                popup: 'animate__animated animate__fadeInDown'
              },
              hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
              }
            });
          }
        }, 1000);
      }
    },
    onError: (error: any) => {
      setError(error.message || "Erreur lors de l'enregistrement de la signature");
    },
  });

  const resetForm = () => {
    setReason('');
    setDetailedReason('');
    setFinancialTerms('');
    setTimeline('');
    setDepositHandling('');
    setRentRefund('');
    setAdditionalConditions('');
    setTerminationType('mutual');
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "text-xs px-2 py-1 rounded-full font-medium";
    
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className={`${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-300`}>
          <Clock className="w-3 h-3 mr-1" /> En attente
        </Badge>;
      case 'negotiating':
        return <Badge variant="outline" className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-300`}>
          <AlertTriangle className="w-3 h-3 mr-1" /> Négociation
        </Badge>;
      case 'accepted':
        return <Badge variant="outline" className={`${baseClasses} bg-green-50 text-green-700 border-green-300`}>
          <CheckCircle className="w-3 h-3 mr-1" /> Acceptée
        </Badge>;
      case 'signed':
        return <Badge variant="outline" className={`${baseClasses} bg-purple-50 text-purple-700 border-purple-300`}>
          <FileText className="w-3 h-3 mr-1" /> Signée
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className={`${baseClasses} bg-emerald-50 text-emerald-700 border-emerald-300`}>
          <CheckCircle className="w-3 h-3 mr-1" /> Terminée
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className={`${baseClasses} bg-red-50 text-red-700 border-red-300`}>
          <XCircle className="w-3 h-3 mr-1" /> Refusée
        </Badge>;
      default:
        return null;
    }
  };

  const canCreateRequest = !terminationRequest || terminationRequest.status === 'rejected';
  const needsPasswordConfirmation = terminationRequest && 
    terminationRequest.status === 'accepted' && 
    ((userType === 'owner' && !terminationRequest.ownerPasswordConfirmed) ||
     (userType === 'tenant' && !terminationRequest.tenantPasswordConfirmed));
  
  const needsSignature = terminationRequest && 
    terminationRequest.ownerPasswordConfirmed && 
    terminationRequest.tenantPasswordConfirmed &&
    ((userType === 'owner' && !terminationRequest.ownerSignature) ||
     (userType === 'tenant' && !terminationRequest.tenantSignature));

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      
      {/* Main Action Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Arrêt de Contrat Bilatéral
          </CardTitle>
          <CardDescription>
            Système complet d'arrêt de contrat avec confirmation par mot de passe et signature électronique des deux parties.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!terminationRequest && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Aucune demande d'arrêt en cours</p>
              {canCreateRequest && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                  data-testid="button-create-termination"
                >
                  Créer une demande d'arrêt
                </Button>
              )}
            </div>
          )}

          {terminationRequest && (
            <div className="space-y-4">
              {/* Status and Basic Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Demande d'Arrêt #{terminationRequest.id}</h3>
                  <p className="text-sm text-gray-600">
                    Créée {formatDistanceToNow(new Date(terminationRequest.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                {getStatusBadge(terminationRequest.status)}
              </div>

              <Separator />

              {/* Termination Details */}
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="progress">Progression</TabsTrigger>
                  <TabsTrigger value="terms">Conditions</TabsTrigger>
                  <TabsTrigger value="signatures">Signatures</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Raison principale</Label>
                    <p className="text-sm text-gray-700 mt-1">{terminationRequest.reason}</p>
                  </div>
                  {terminationRequest.detailedReason && (
                    <div>
                      <Label className="text-sm font-medium">Explication détaillée</Label>
                      <p className="text-sm text-gray-700 mt-1">{terminationRequest.detailedReason}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Type d'arrêt</Label>
                    <p className="text-sm text-gray-700 mt-1 capitalize">{terminationRequest.terminationType.replace('_', ' ')}</p>
                  </div>
                </TabsContent>

                <TabsContent value="progress" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${terminationRequest.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Demande créée</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${terminationRequest.ownerPasswordConfirmed ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Confirmation propriétaire</span>
                      {terminationRequest.ownerPasswordConfirmed && (
                        <UserCheck className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${terminationRequest.tenantPasswordConfirmed ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Confirmation locataire</span>
                      {terminationRequest.tenantPasswordConfirmed && (
                        <UserCheck className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${terminationRequest.ownerSignature ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Signature propriétaire</span>
                      {terminationRequest.ownerSignature && (
                        <FileText className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${terminationRequest.tenantSignature ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Signature locataire</span>
                      {terminationRequest.tenantSignature && (
                        <FileText className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="terms" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Conditions financières</Label>
                      <p className="text-sm text-gray-700 mt-1">{terminationRequest.proposedTerms.financialTerms}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Délai</Label>
                      <p className="text-sm text-gray-700 mt-1">{terminationRequest.proposedTerms.timeline}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Gestion de la caution</Label>
                      <p className="text-sm text-gray-700 mt-1">{terminationRequest.proposedTerms.depositHandling}</p>
                    </div>
                    {terminationRequest.proposedTerms.rentRefund && (
                      <div>
                        <Label className="text-sm font-medium">Remboursement loyer</Label>
                        <p className="text-sm text-gray-700 mt-1">{terminationRequest.proposedTerms.rentRefund}</p>
                      </div>
                    )}
                  </div>
                  {terminationRequest.proposedTerms.additionalConditions && (
                    <div>
                      <Label className="text-sm font-medium">Conditions supplémentaires</Label>
                      <p className="text-sm text-gray-700 mt-1">{terminationRequest.proposedTerms.additionalConditions}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="signatures" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Propriétaire</h4>
                      {terminationRequest.ownerSignature ? (
                        <div>
                          <img src={terminationRequest.ownerSignature} alt="Signature propriétaire" className="max-w-full h-20 border" />
                          <p className="text-xs text-gray-600 mt-1">
                            Signé le {terminationRequest.ownerSignedAt && formatDistanceToNow(new Date(terminationRequest.ownerSignedAt), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Pas encore signé</p>
                      )}
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Locataire</h4>
                      {terminationRequest.tenantSignature ? (
                        <div>
                          <img src={terminationRequest.tenantSignature} alt="Signature locataire" className="max-w-full h-20 border" />
                          <p className="text-xs text-gray-600 mt-1">
                            Signé le {terminationRequest.tenantSignedAt && formatDistanceToNow(new Date(terminationRequest.tenantSignedAt), { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Pas encore signé</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {needsPasswordConfirmation && (
                  <Button 
                    onClick={() => setShowPasswordDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                    data-testid="button-confirm-password"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Confirmer avec mot de passe
                  </Button>
                )}
                
                {needsSignature && (
                  <Button 
                    onClick={() => setShowSigningDialog(true)}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="button-sign-document"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Signer le document
                  </Button>
                )}

                {terminationRequest.terminationDocumentUrl && (
                  <Button 
                    variant="outline"
                    onClick={() => window.open(terminationRequest.terminationDocumentUrl, '_blank')}
                    data-testid="button-view-document"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Voir le document
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Termination Request Dialog */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Créer une Demande d'Arrêt de Contrat</AlertDialogTitle>
            <AlertDialogDescription>
              Remplissez tous les détails pour créer une demande d'arrêt de contrat bilatérale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="reason">Raison principale *</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Fin anticipée du bail, changement de situation..."
                  data-testid="input-termination-reason"
                />
              </div>
              
              <div>
                <Label htmlFor="detailed-reason">Explication détaillée</Label>
                <Textarea
                  id="detailed-reason"
                  value={detailedReason}
                  onChange={(e) => setDetailedReason(e.target.value)}
                  placeholder="Expliquez en détail les circonstances..."
                  rows={3}
                  data-testid="textarea-detailed-reason"
                />
              </div>
            </div>

            {/* Financial Terms */}
            <div className="space-y-3">
              <h4 className="font-medium">Conditions Financières</h4>
              
              <div>
                <Label htmlFor="financial-terms">Termes financiers *</Label>
                <Textarea
                  id="financial-terms"
                  value={financialTerms}
                  onChange={(e) => setFinancialTerms(e.target.value)}
                  placeholder="Ex: Aucune pénalité, remboursement prorata, etc."
                  rows={2}
                  data-testid="textarea-financial-terms"
                />
              </div>
              
              <div>
                <Label htmlFor="deposit-handling">Gestion de la caution *</Label>
                <Textarea
                  id="deposit-handling"
                  value={depositHandling}
                  onChange={(e) => setDepositHandling(e.target.value)}
                  placeholder="Ex: Remboursement intégral, déduction des frais..."
                  rows={2}
                  data-testid="textarea-deposit-handling"
                />
              </div>
              
              <div>
                <Label htmlFor="timeline">Délai d'exécution *</Label>
                <Input
                  id="timeline"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="Ex: 30 jours, fin du mois..."
                  data-testid="input-timeline"
                />
              </div>
            </div>

            {/* Additional Conditions */}
            <div>
              <Label htmlFor="additional-conditions">Conditions supplémentaires</Label>
              <Textarea
                id="additional-conditions"
                value={additionalConditions}
                onChange={(e) => setAdditionalConditions(e.target.value)}
                placeholder="Toute condition particulière..."
                rows={2}
                data-testid="textarea-additional-conditions"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={resetForm}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => createTerminationMutation.mutate()}
              disabled={!reason.trim() || !financialTerms.trim() || !depositHandling.trim() || !timeline.trim() || createTerminationMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-submit-termination-request"
            >
              {createTerminationMutation.isPending ? 'Création...' : 'Créer la demande'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Confirmation Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Confirmation par Mot de Passe
            </AlertDialogTitle>
            <AlertDialogDescription>
              Pour confirmer votre accord sur les termes de l'arrêt, veuillez saisir votre mot de passe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  data-testid="input-confirmation-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPassword('')}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmPasswordMutation.mutate()}
              disabled={!password.trim() || confirmPasswordMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-submit-password"
            >
              {confirmPasswordMutation.isPending ? 'Confirmation...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Digital Signature Dialog */}
      <AlertDialog open={showSigningDialog} onOpenChange={setShowSigningDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Signature Électronique
            </AlertDialogTitle>
            <AlertDialogDescription>
              Signez électroniquement le document d'arrêt de contrat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Votre signature *</Label>
              <div className="border rounded-lg p-2 bg-white">
                <SignatureCanvas
                  ref={(ref) => setSignatureCanvas(ref)}
                  canvasProps={{
                    width: 400,
                    height: 150,
                    className: 'signature-canvas border rounded'
                  }}
                />
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => signatureCanvas?.clear()}
                  data-testid="button-clear-signature"
                >
                  Effacer
                </Button>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => signatureCanvas?.clear()}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submitSignatureMutation.mutate()}
              disabled={submitSignatureMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-submit-signature"
            >
              {submitSignatureMutation.isPending ? 'Enregistrement...' : 'Enregistrer la signature'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}