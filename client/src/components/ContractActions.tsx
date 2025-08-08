import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Download, Edit, Trash2, Clock, AlertTriangle, FileX } from "lucide-react";
import ContractGenerator from "./ContractGenerator";

interface Contract {
  id: number;
  status: string;
  contractData: any;
  tenantSignDeadline?: string | null;
}

interface ContractActionsProps {
  contract: Contract;
  currentUserId: number;
  isOwner: boolean;
}

export function ContractActions({ contract, currentUserId, isOwner }: ContractActionsProps) {
  const { toast } = useToast();
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);

  // Download PDF mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/contracts/${contract.id}/download`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to generate download link');
      return response.json();
    },
    onSuccess: (data) => {
      // In a real implementation, this would trigger the actual PDF download
      toast({
        title: "Téléchargement prêt",
        description: `Le contrat ${data.filename} est prêt à être téléchargé.`,
      });
      
      // For demo purposes, show download URL
      console.log("Download URL:", data.downloadUrl);
      
      // In real implementation, you would trigger download:
      // window.open(data.downloadUrl, '_blank');
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de télécharger le contrat",
        variant: "destructive",
      });
    }
  });

  // Contract modification mutation
  const modifyMutation = useMutation({
    mutationFn: async (newContractData: any) => {
      return apiRequest(`/api/contracts/${contract.id}/modify`, {
        method: 'PUT',
        body: JSON.stringify({ contractData: newContractData })
      });
    },
    onSuccess: () => {
      toast({
        title: "Contrat modifié",
        description: "Le contrat a été modifié avec succès. Les signatures ont été supprimées.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contract.id] });
      setIsModifyDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le contrat",
        variant: "destructive",
      });
    }
  });

  // Early termination request mutation
  const terminationRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/contracts/${contract.id}/request-termination`, {
        method: 'POST',
        body: JSON.stringify({
          requestedBy: currentUserId,
          reason: "Demande d'arrêt anticipé par le propriétaire"
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Demande envoyée",
        description: "Demande d'arrêt anticipé envoyée au locataire.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contract.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la demande",
        variant: "destructive",
      });
    }
  });

  // Modification request mutation
  const modificationRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/contracts/${contract.id}/request-modification`, {
        method: 'POST',
        body: JSON.stringify({
          requestedBy: currentUserId,
          requestedChanges: "Demande de modification des termes du contrat"
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Demande envoyée",
        description: "Demande de modification envoyée au locataire.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts', contract.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la demande",
        variant: "destructive",
      });
    }
  });

  const canDownload = contract.status === 'active' || contract.status === 'fully_signed';
  const canModify = isOwner && (contract.status === 'draft' || contract.status === 'owner_signed');
  const isExpired = contract.tenantSignDeadline && new Date() > new Date(contract.tenantSignDeadline);
  const isActive = contract.status === 'active' || contract.status === 'fully_signed';
  const canRequestTermination = isOwner && isActive;
  const canRequestModification = isOwner && isActive;
  
  // Tenants have very limited actions - only download when fully signed
  const isTenant = !isOwner;

  return (
    <div className="flex items-center gap-2">
      {/* Download PDF Button */}
      {canDownload && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadMutation.mutate()}
          disabled={downloadMutation.isPending}
        >
          <Download className="h-4 w-4 mr-2" />
          {downloadMutation.isPending ? "Génération..." : "Télécharger PDF"}
        </Button>
      )}

      {/* Modify Contract Button - Only for owners */}
      {canModify && !isExpired && !isTenant && (
        <Dialog open={isModifyDialogOpen} onOpenChange={setIsModifyDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le contrat</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <ContractGenerator
                initialData={contract.contractData}
                onSave={(contractData: any) => modifyMutation.mutate(contractData)}
                isLoading={modifyMutation.isPending}
                mode="modify"
                currentUserId={currentUserId}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Early Termination Request - Only for owners of active contracts */}
      {canRequestTermination && !isTenant && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-orange-500 text-orange-600 hover:bg-orange-50">
              <Clock className="h-4 w-4 mr-2" />
              Arrêt anticipé
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Demander un arrêt anticipé
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Vous êtes sur le point de demander un arrêt anticipé de ce contrat.</p>
                <div className="bg-orange-50 p-3 rounded-lg border-l-4 border-orange-400">
                  <p className="text-sm text-orange-700">
                    <strong>Important :</strong> Le locataire doit accepter cette demande pour que l'arrêt soit effectif. 
                    Si accepté, le contrat sera immédiatement terminé et le bien redeviendra disponible.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => terminationRequestMutation.mutate()}
                disabled={terminationRequestMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {terminationRequestMutation.isPending ? "Envoi..." : "Envoyer la demande"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Modification Request - Only for owners of active contracts */}
      {canRequestModification && !isTenant && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-blue-500 text-blue-600 hover:bg-blue-50">
              <Edit className="h-4 w-4 mr-2" />
              Demander modification
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-500" />
                Demander une modification
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Vous allez demander au locataire l'autorisation de modifier ce contrat.</p>
                <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-700">
                    <strong>Note :</strong> Le locataire doit approuver votre demande avant que vous puissiez 
                    modifier le contrat. Les signatures seront supprimées après modification.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => modificationRequestMutation.mutate()}
                disabled={modificationRequestMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {modificationRequestMutation.isPending ? "Envoi..." : "Envoyer la demande"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Cancel/Delete Contract - Only for owners */}
      {(isOwner && !isTenant && (contract.status === 'draft' || isExpired)) && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              {isExpired ? "Supprimer" : "Annuler"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir {isExpired ? "supprimer" : "annuler"} ce contrat ? 
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  // In real implementation, add delete/cancel mutation
                  toast({
                    title: "Contrat supprimé",
                    description: "Le contrat a été supprimé avec succès.",
                  });
                }}
              >
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}