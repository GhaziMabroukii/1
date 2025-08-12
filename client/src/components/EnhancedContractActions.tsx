import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Trash2, Clock, CheckCircle, XCircle, ChevronDown, RefreshCw } from 'lucide-react';
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
import { useLocation } from 'wouter';

interface ContractActionsProps {
  contract: any;
  currentUserId: number;
  userType: 'tenant' | 'owner';
}

interface RequestStatus {
  id: number;
  type: 'termination';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export function EnhancedContractActions({ contract, currentUserId, userType }: ContractActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, navigate] = useLocation();
  const [showTerminationDialog, setShowTerminationDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminationReason, setTerminationReason] = useState('');

  // Fetch pending requests for this contract
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery<RequestStatus[]>({
    queryKey: [`/api/contracts/${contract.id}/pending-requests`],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contract.id}/pending-requests`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Pending requests query returned:', data);
      return data;
    },
    enabled: !!contract.id,
    staleTime: 0,
    gcTime: 0
  });

  // Debug log
  console.log('EnhancedContractActions Debug:', {
    contractId: contract.id,
    pendingRequests,
    requestsLoading,
    terminationRequest: pendingRequests.find(r => r.type === 'termination'),
    userType,
    currentUserId,
    queryKey: `/api/contracts/${contract.id}/pending-requests`
  });

  // Force refresh pending requests when component mounts
  React.useEffect(() => {
    if (contract.id) {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contract.id}/pending-requests`] });
    }
  }, [contract.id, queryClient]);

  // Find current request statuses
  const terminationRequest = pendingRequests.find(r => r.type === 'termination');

  // Early termination request mutation
  const terminationRequestMutation = useMutation({
    mutationFn: async () => {
      if (!terminationReason.trim()) {
        throw new Error('La raison de la résiliation est obligatoire');
      }
      return apiRequest(`/api/contracts/${contract.id}/request-termination`, {
        method: 'POST',
        body: JSON.stringify({
          requestedBy: currentUserId,
          reason: terminationReason
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Demande envoyée",
        description: "Votre demande d'arrêt anticipé a été envoyée au locataire"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contract.id}/pending-requests`] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      setShowTerminationDialog(false);
      setTerminationReason('');
      setError(null);
    },
    onError: (error: any) => {
      setError(error.message || "Erreur lors de l'envoi de la demande");
      setShowTerminationDialog(false);
    }
  });

  const getRequestStatusBadge = (status: string, type: string) => {
    const baseClasses = "text-xs px-2 py-1 rounded-full font-medium";
    
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className={`${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-300`}>
          <Clock className="w-3 h-3 mr-1" /> En attente
        </Badge>;
      case 'accepted':
        return <Badge variant="outline" className={`${baseClasses} bg-green-50 text-green-700 border-green-300`}>
          <CheckCircle className="w-3 h-3 mr-1" /> Acceptée
        </Badge>;
      case 'completed':
        return <Badge variant="outline" className={`${baseClasses} bg-blue-50 text-blue-700 border-blue-300`}>
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

  const getButtonText = (requestType: 'termination', request?: RequestStatus) => {
    if (!request) {
      return 'Arrêt anticipé';
    }
    
    switch (request.status) {
      case 'pending':
        return 'Arrêt demandé';
      case 'accepted':
        return 'Arrêt accepté';
      case 'rejected':
        return 'Renvoyer arrêt';
      default:
        return 'Arrêt anticipé';
    }
  };

  const canSendRequest = (request?: RequestStatus) => {
    return !request || request.status === 'rejected';
  };

  // Only show actions for owners
  if (userType !== 'owner' || contract.ownerId !== currentUserId) {
    return null;
  }

  return (
    <div className="space-y-4">
      {error && <ErrorAlert message={error} />}
      
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Termination Request Button */}
        <div className="flex-1">
          <Button
            onClick={() => canSendRequest(terminationRequest) ? setShowTerminationDialog(true) : null}
            disabled={!canSendRequest(terminationRequest) || terminationRequestMutation.isPending}
            className={`w-full ${
              terminationRequest?.status === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700' :
              terminationRequest?.status === 'accepted' ? 'bg-green-600 hover:bg-green-700' :
              'bg-orange-600 hover:bg-orange-700'
            }`}
            data-testid="button-termination-request"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {getButtonText('termination', terminationRequest)}
            {terminationRequestMutation.isPending && (
              <RefreshCw className="w-3 h-3 ml-2 animate-spin" />
            )}
          </Button>
          
          {terminationRequest && (
            <div className="mt-2 flex items-center justify-between">
              {getRequestStatusBadge(terminationRequest.status, 'termination')}
              
              {/* Dropdown menu for request details */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2" data-testid="button-termination-details">
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate(`/tenant-requests/termination/${terminationRequest.id}`)}
                  >
                    Voir les détails
                  </DropdownMenuItem>
                  {terminationRequest.status === 'rejected' && (
                    <DropdownMenuItem
                      onClick={() => setShowTerminationDialog(true)}
                    >
                      Renvoyer la demande
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Termination Request Dialog */}
      <AlertDialog open={showTerminationDialog} onOpenChange={setShowTerminationDialog}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-orange-600" />
              Demande d'Arrêt Anticipé
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="text-sm">
                Demander l'arrêt anticipé de ce contrat de location. Le locataire recevra une notification 
                et pourra accepter ou refuser votre demande.
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="termination-reason" className="text-sm font-medium">
                    Raison de l'arrêt *
                  </Label>
                  <Textarea
                    id="termination-reason"
                    placeholder="Expliquez pourquoi vous souhaitez arrêter le contrat..."
                    value={terminationReason}
                    onChange={(e) => setTerminationReason(e.target.value)}
                    className="mt-1"
                    rows={3}
                    data-testid="textarea-termination-reason"
                  />
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>Important :</strong> Si acceptée, la résiliation sera immédiate.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTerminationReason('')} data-testid="button-cancel-termination">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => terminationRequestMutation.mutate()}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={!terminationReason.trim() || terminationRequestMutation.isPending}
              data-testid="button-submit-termination"
            >
              {terminationRequestMutation.isPending ? 'Envoi...' : 'Envoyer la demande'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}