import React, { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import ContractGenerator from "@/components/ContractGenerator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ContractStatusBadge } from "@/components/ContractStatusBadge";
import { EnhancedContractActions } from "@/components/EnhancedContractActions";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AutomaticTenantNavigation } from "@/components/AutomaticTenantNavigation";
import { TenantRequestsDropdown } from "@/components/TenantRequestsDropdown";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const ContractView = () => {
  const [match, params] = useRoute("/contract/:id");
  const id = params?.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch contract data
  const { data: contract, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/contracts/${id}`],
    queryFn: async () => {
      console.log("Query function called for contract:", id);
      const response = await fetch(`/api/contracts/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Query function returned data:", data);
      return data;
    },
    enabled: !!id,
    retry: 3,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0 // Don't cache the query
  });

  // Force refetch when component mounts
  React.useEffect(() => {
    if (id) {
      console.log("Force refetching contract:", id);
      refetch().then((result) => {
        console.log("Refetch result:", result);
      }).catch((err) => {
        console.error("Refetch error:", err);
      });
    }
  }, [id, refetch]);

  // Sign contract mutation
  const signContract = useMutation({
    mutationFn: async (signatureData: any) => {
      return await apiRequest(`/api/contracts/${id}/sign`, {
        method: "PUT",
        body: JSON.stringify(signatureData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${id}`] });
      toast({
        title: "Contrat signé",
        description: "Votre signature a été enregistrée avec succès."
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de signer le contrat. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!contract && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Contrat non trouvé</h1>
          <p className="text-muted-foreground mb-4">
            Le contrat demandé (ID: {id}) n'existe pas ou vous n'avez pas les permissions pour le voir.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Error: {error ? JSON.stringify(error) : 'No error details'}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Query URL: /api/contracts/{id}
          </p>
          <div className="space-x-4">
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Recharger la page
            </Button>
            <Button variant="outline" onClick={() => {
              console.log("Manual test - fetching contract");
              fetch(`/api/contracts/${id}`)
                .then(r => r.json())
                .then(data => console.log("Manual fetch result:", data))
                .catch(err => console.error("Manual fetch error:", err));
            }}>
              Test API Direct
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Debug logging (always log these)
  console.log("=== ContractView Debug ===");
  console.log("Contract ID:", id);
  console.log("Contract data:", contract);
  console.log("Loading state:", isLoading);
  console.log("Error state:", error);
  console.log("Has contract?", !!contract);
  console.log("========================");

  // Get current user from localStorage (real session management)
  const getCurrentUser = () => {
    const userData = localStorage.getItem("userData");
    const userId = localStorage.getItem("userId");
    const userType = localStorage.getItem("userType");
    
    if (userData && userId && userType) {
      try {
        const user = JSON.parse(userData);
        return {
          id: parseInt(userId),
          userType: userType,
          ...user
        };
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  };

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id || 0;
  
  // Debug current user info
  console.log("Current user from localStorage:", currentUser);
  console.log("Current user ID:", currentUserId);
  console.log("Contract owner ID:", contract?.ownerId);
  console.log("Contract tenant ID:", contract?.tenantId);
  
  // Only check permissions if we have a valid contract
  if (contract && contract.ownerId && contract.tenantId) {
    const canViewContract = (
      contract.ownerId === currentUserId || 
      contract.tenantId === currentUserId
    );

    console.log("Can view contract?", canViewContract);
    
    if (!canViewContract) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas les permissions pour voir ce contrat.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AutomaticTenantNavigation 
        userId={currentUserId} 
        userType={contract.ownerId === currentUserId ? 'owner' : 'tenant'} 
      />
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-4">
            <TenantRequestsDropdown 
              userId={currentUserId} 
              userType={contract.ownerId === currentUserId ? 'owner' : 'tenant'} 
            />
            <NotificationCenter userId={currentUserId} />
            <EnhancedContractActions 
              contract={contract} 
              currentUserId={currentUserId} 
              userType={contract.ownerId === currentUserId ? 'owner' : 'tenant'} 
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold">Contrat #{contract.id}</h1>
            <ContractStatusBadge 
              status={contract.status} 
              tenantSignDeadline={contract.tenantSignDeadline}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Créé le {format(new Date(contract.createdAt), 'dd MMMM yyyy', { locale: fr })}</span>
            {contract.tenantSignDeadline && contract.status === 'owner_signed' && (
              <span className="text-yellow-600 font-medium">
                Échéance: {format(new Date(contract.tenantSignDeadline), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </span>
            )}
          </div>
        </div>

        <ContractGenerator 
          contract={contract}
          onSign={(signatureData) => signContract.mutate(signatureData)}
          isLoading={signContract.isPending}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
};

export default ContractView;