import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CheckCircle, XCircle, FileText, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "@/components/Header";

export default function Offers() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user from localStorage
  const getCurrentUser = () => {
    const userData = localStorage.getItem("userData");
    
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error("Error parsing userData:", e);
      }
    }
    
    // If no user is logged in, return null to indicate no authentication
    return null;
  };
  
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  
  // Listen for storage changes to update user when switched
  useEffect(() => {
    const handleStorageChange = () => {
      const newUser = getCurrentUser();
      console.log("Storage changed, new user:", newUser);
      setCurrentUser(newUser);
    };

    // Initial check
    handleStorageChange();

    // Listen for storage events and focus events (for same-tab changes)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    
    // Check for changes every 500ms for faster updates
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  
  console.log("Current user in Offers page:", currentUser);

  // Redirect to login if no user is authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["/api/offers", currentUser?.id, currentUser?.userType],
    queryFn: async () => {
      if (!currentUser) return [];
      
      const params = new URLSearchParams({
        userId: currentUser.id.toString(),
        userType: currentUser.userType
      });
      const response = await fetch(`/api/offers?${params}`);
      const data = await response.json();
      
      // Ensure data is always an array
      return Array.isArray(data) ? data : [];
    },
    enabled: !!currentUser, // Only run query if user is authenticated
  });

  const updateOfferStatus = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: number; status: string }) => {
      return await apiRequest(`/api/offers/${offerId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Offre mise à jour",
        description: "Le statut de l'offre a été modifié",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'offre",
        variant: "destructive",
      });
    }
  });

  const requestContract = useMutation({
    mutationFn: async (offerId: number) => {
      return await apiRequest(`/api/offers/${offerId}/request-contract`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      toast({
        title: "Contrat demandé",
        description: "Votre demande de contrat a été envoyée au propriétaire",
      });
    },
    onError: () => {
      toast({
        title: "Erreur", 
        description: "Impossible de demander le contrat",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "accepted":
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Acceptée</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Refusée</Badge>;
      case "contract_requested":
        return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Contrat demandé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const OfferCard = ({ offer, type }: { offer: any; type: 'sent' | 'received' }) => (
    <Card key={offer.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{offer.property?.title || `Propriété #${offer.propertyId}`}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {type === 'sent' 
                ? `Offre envoyée à ${offer.owner?.firstName} ${offer.owner?.lastName}` 
                : `Offre reçue de ${offer.tenant?.firstName} ${offer.tenant?.lastName}`}
            </p>
            {offer.property?.address && (
              <p className="text-xs text-muted-foreground">{offer.property.address}</p>
            )}
          </div>
          {getStatusBadge(offer.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium">Loyer mensuel</p>
            <p className="text-lg font-bold text-primary">{offer.monthlyRent} TND</p>
          </div>
          <div>
            <p className="text-sm font-medium">Dépôt de garantie</p>
            <p className="text-lg">{offer.deposit || 0} TND</p>
          </div>
          <div>
            <p className="text-sm font-medium">Date de début</p>
            <p>{format(new Date(offer.startDate), "dd MMM yyyy", { locale: fr })}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Date de fin</p>
            <p>{format(new Date(offer.endDate), "dd MMM yyyy", { locale: fr })}</p>
          </div>
        </div>

        {offer.conditions && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">Conditions</p>
            <p className="text-sm text-muted-foreground">{offer.conditions}</p>
          </div>
        )}

        <div className="flex gap-2">
          {type === 'received' && offer.status === 'pending' && (
            <>
              <Button 
                size="sm" 
                onClick={() => updateOfferStatus.mutate({ offerId: offer.id, status: 'accepted' })}
                disabled={updateOfferStatus.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Accepter
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => updateOfferStatus.mutate({ offerId: offer.id, status: 'rejected' })}
                disabled={updateOfferStatus.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Refuser
              </Button>
            </>
          )}

          {type === 'sent' && offer.status === 'accepted' && (
            <Button 
              size="sm"
              onClick={() => requestContract.mutate(offer.id)}
              disabled={requestContract.isPending}
            >
              <FileText className="h-4 w-4 mr-1" />
              Demander un contrat
            </Button>
          )}

          {offer.status === 'contract_requested' && (
            <Button size="sm" variant="outline" onClick={() => navigate('/contracts')}>
              <FileText className="h-4 w-4 mr-1" />
              Voir les contrats
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              {currentUser.userType === 'owner' ? 'Mes offres reçues' : 'Mes offres envoyées'}
            </h1>
            <p className="text-muted-foreground">
              {currentUser.userType === 'owner' 
                ? 'Gérez vos offres reçues pour vos propriétés' 
                : 'Suivez vos offres de location envoyées'}
            </p>
          </div>
        </div>

        <div className="w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {currentUser.userType === 'owner' ? 'Mes offres reçues' : 'Mes offres envoyées'}
            </h2>
            <p className="text-muted-foreground">
              {currentUser.userType === 'owner' 
                ? 'Gérez les offres reçues pour vos propriétés' 
                : 'Suivez le statut de vos offres de location'}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Chargement des offres...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">
                {currentUser.userType === 'owner' ? 'Aucune offre reçue' : 'Aucune offre envoyée'}
              </p>
              <p className="text-muted-foreground">
                {currentUser.userType === 'owner' 
                  ? 'Vous n\'avez reçu aucune offre pour vos propriétés.' 
                  : 'Vous n\'avez envoyé aucune offre pour le moment. Parcourez les propriétés disponibles pour faire des offres.'}
              </p>
            </div>
          ) : (
            offers.map((offer: any) => (
              <OfferCard 
                key={offer.id} 
                offer={offer} 
                type={currentUser.userType === 'owner' ? 'received' : 'sent'} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}