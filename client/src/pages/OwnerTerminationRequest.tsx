import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface OwnerTerminationRequestProps {
  contractId: number;
  currentUserId: number;
}

export function OwnerTerminationRequest({ contractId, currentUserId }: OwnerTerminationRequestProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    reason: '',
    detailedReason: '',
    terminationType: 'early_by_owner' as 'mutual' | 'early_by_owner' | 'dispute',
    proposedTerms: {
      timeline: '',
      rentRefund: '',
      financialTerms: '',
      depositHandling: '',
      additionalConditions: ''
    }
  });

  const createTerminationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest(`/api/contracts/${contractId}/owner-termination-request`, {
        method: 'POST',
        body: JSON.stringify({
          requestedBy: currentUserId,
          ...data
        })
      });
    },
    onSuccess: async (response) => {
      toast({
        title: "Demande d'arrêt envoyée",
        description: "Votre demande a été envoyée au locataire. Vous recevrez une notification de sa réponse.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/owner-requests/${currentUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contract-termination-requests`] });
      
      // Redirect to contract termination page with "mes demandes" tab active
      navigate('/contract-termination?tab=my-requests');
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la demande",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim() || !formData.detailedReason.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir au minimum la raison et l'explication détaillée",
        variant: "destructive"
      });
      return;
    }
    createTerminationMutation.mutate(formData);
  };

  const updateProposedTerms = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      proposedTerms: {
        ...prev.proposedTerms,
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/contract/${contractId}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au contrat
          </Button>
          <h1 className="text-3xl font-bold">Demande d'arrêt de contrat</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="mr-2 h-5 w-5" />
              Nouvelle demande d'arrêt (Propriétaire)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-destructive" />
                  Motifs de la résiliation
                </h3>
                
                <div>
                  <Label htmlFor="terminationType">Type de résiliation *</Label>
                  <Select 
                    value={formData.terminationType} 
                    onValueChange={(value: 'mutual' | 'early_by_owner' | 'dispute') => 
                      setFormData(prev => ({...prev, terminationType: value}))
                    }
                  >
                    <SelectTrigger data-testid="select-termination-type">
                      <SelectValue placeholder="Choisissez le type de résiliation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early_by_owner">Résiliation anticipée par le propriétaire</SelectItem>
                      <SelectItem value="mutual">Résiliation à l'amiable</SelectItem>
                      <SelectItem value="dispute">Résiliation pour litige</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reason">Raison principale *</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({...prev, reason: e.target.value}))}
                    placeholder="Ex: Vente du bien, non-respect du bail, problèmes de paiement..."
                    required
                    data-testid="input-reason"
                  />
                </div>

                <div>
                  <Label htmlFor="detailedReason">Explication détaillée *</Label>
                  <Textarea
                    id="detailedReason"
                    value={formData.detailedReason}
                    onChange={(e) => setFormData(prev => ({...prev, detailedReason: e.target.value}))}
                    placeholder="Expliquez en détail les circonstances et raisons de cette demande..."
                    required
                    rows={4}
                    data-testid="textarea-detailed-reason"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Conditions proposées</h3>
                
                <div>
                  <Label htmlFor="timeline">Délai souhaité</Label>
                  <Input
                    id="timeline"
                    value={formData.proposedTerms.timeline}
                    onChange={(e) => updateProposedTerms('timeline', e.target.value)}
                    placeholder="Ex: 30 jours, fin du mois, immédiat..."
                    data-testid="input-timeline"
                  />
                </div>

                <div>
                  <Label htmlFor="financialTerms">Conditions financières</Label>
                  <Input
                    id="financialTerms"
                    value={formData.proposedTerms.financialTerms}
                    onChange={(e) => updateProposedTerms('financialTerms', e.target.value)}
                    placeholder="Pénalités, indemnités, remboursements..."
                    data-testid="input-financial-terms"
                  />
                </div>

                <div>
                  <Label htmlFor="depositHandling">Gestion de la caution</Label>
                  <Input
                    id="depositHandling"
                    value={formData.proposedTerms.depositHandling}
                    onChange={(e) => updateProposedTerms('depositHandling', e.target.value)}
                    placeholder="Remboursement total/partiel, déductions..."
                    data-testid="input-deposit-handling"
                  />
                </div>

                <div>
                  <Label htmlFor="additionalConditions">Conditions supplémentaires</Label>
                  <Textarea
                    id="additionalConditions"
                    value={formData.proposedTerms.additionalConditions}
                    onChange={(e) => updateProposedTerms('additionalConditions', e.target.value)}
                    placeholder="Autres conditions ou remarques..."
                    rows={3}
                    data-testid="textarea-additional-conditions"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/contract/${contractId}`)}
                  data-testid="button-cancel"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createTerminationMutation.isPending}
                  data-testid="button-submit-request"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {createTerminationMutation.isPending ? 'Envoi...' : 'Envoyer la demande'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OwnerTerminationRequest;