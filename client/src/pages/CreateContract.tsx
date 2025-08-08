import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ErrorAlert } from "@/components/ErrorAlert";
import { 
  FileText, 
  ArrowLeft, 
  User, 
  Home, 
  Calendar, 
  DollarSign,
  Send,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Header from "@/components/Header";

interface ContractRequest {
  id: number;
  propertyId: number;
  tenantId: number;
  ownerId: number;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  deposit: string;
  conditions: string;
  status: string;
  property: {
    title: string;
    address: string;
  };
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function CreateContract() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [contractError, setContractError] = useState<{message: string, details?: string} | null>(null);
  const [contractData, setContractData] = useState({
    landlordName: "",
    landlordCin: "",
    tenantName: "",
    tenantCin: "",
    propertyTitle: "",
    propertyAddress: "",
    startDate: "",
    endDate: "",
    monthlyRent: "",
    deposit: "",
    specialConditions: "",
    paymentDueDate: "1", // Default to 1st of each month
  });

  // Get current user from localStorage (consistent with ContractsDashboard)
  const getCurrentUser = () => {
    const userData = localStorage.getItem("userData");
    const userId = localStorage.getItem("userId");
    const userType = localStorage.getItem("userType");
    
    if (userData && userId && userType) {
      try {
        const user = JSON.parse(userData);
        const currentUser = {
          id: parseInt(userId),
          userType: userType,
          ...user
        };
        console.log("Current user in CreateContract:", currentUser);
        return currentUser;
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    console.log("No user found in localStorage");
    return null;
  };

  const [currentUser] = useState(getCurrentUser());

  // Fetch contract requests (offers with status 'contract_requested')
  const { data: contractRequests = [], isLoading } = useQuery({
    queryKey: ["/api/offers", "contract_requests", currentUser?.id],
    queryFn: async () => {
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      const params = new URLSearchParams({
        userId: currentUser.id.toString(),
        userType: currentUser.userType,
        status: "contract_requested"
      });
      
      console.log("Fetching contract requests for user:", currentUser.id, "userType:", currentUser.userType);
      
      const response = await fetch(`/api/offers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch contract requests');
      const data = await response.json();
      
      console.log("Contract requests received:", data);
      
      // Filter for contract_requested status to be sure
      return Array.isArray(data) ? data.filter((offer: any) => offer.status === 'contract_requested') : [];
    },
    enabled: !!currentUser,
  });

  // Create contract mutation
  const createContract = useMutation({
    mutationFn: async (contractPayload: any) => {
      return await apiRequest("/api/contracts", {
        method: "POST",
        body: JSON.stringify(contractPayload),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      setContractError(null); // Clear any previous errors
      toast({
        title: "Contrat créé",
        description: "Le contrat a été créé avec succès. Vous pouvez maintenant le signer.",
      });
      // Navigate to the specific contract to allow immediate signing
      navigate(`/contract/${data.id}`);
    },
    onError: (error: any) => {
      console.error("Contract creation error:", error);
      
      // Handle contract creation restriction error specifically
      if (error.message && error.message.includes("contrat actif")) {
        setContractError({
          message: "Impossible de créer un nouveau contrat pour cette propriété. Un contrat est déjà actif et doit être terminé ou expiré avant d'en créer un nouveau.",
          details: "Vous pouvez utiliser les options 'Arrêt anticipé' ou 'Demander modification' pour gérer le contrat existant."
        });
      } else {
        setContractError({
          message: error.message || "Une erreur est survenue lors de la création du contrat",
          details: "Veuillez vérifier vos informations et réessayer."
        });
      }
    }
  });

  // Handle offer selection
  const handleOfferSelection = (offerId: string) => {
    const selectedOffer = contractRequests.find((offer: ContractRequest) => offer.id === parseInt(offerId));
    if (selectedOffer) {
      setSelectedOfferId(selectedOffer.id);
      setContractData({
        ...contractData,
        tenantName: `${selectedOffer.tenant.firstName} ${selectedOffer.tenant.lastName}`,
        propertyTitle: selectedOffer.property.title,
        propertyAddress: selectedOffer.property.address,
        startDate: selectedOffer.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        endDate: selectedOffer.endDate.split('T')[0],
        monthlyRent: selectedOffer.monthlyRent,
        deposit: selectedOffer.deposit || selectedOffer.monthlyRent,
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOfferId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une demande de contrat",
        variant: "destructive",
      });
      return;
    }

    if (!contractData.landlordName || !contractData.landlordCin || !contractData.tenantCin) {
      toast({
        title: "Erreur", 
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const selectedOffer = contractRequests.find((offer: ContractRequest) => offer.id === selectedOfferId);
    if (!selectedOffer) return;

    const contractPayload = {
      offerId: selectedOfferId,
      propertyId: selectedOffer.propertyId,
      tenantId: selectedOffer.tenantId,
      ownerId: currentUser.id, // Use the current logged-in user as owner
      contractData: {
        ...contractData,
        createdAt: new Date().toISOString(),
      },
    };
    
    console.log("Creating contract with payload:", contractPayload);

    createContract.mutate(contractPayload);
  };

  // Check authentication
  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }

    if (currentUser.userType !== "owner") {
      toast({
        title: "Accès refusé",
        description: "Seuls les propriétaires peuvent créer des contrats",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
  }, [navigate, currentUser.userType]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="text-lg">Chargement des demandes de contrat...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="outline" onClick={() => navigate("/contracts")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <span>Créer un Contrat</span>
            </h1>
            <p className="text-muted-foreground">
              Créez un contrat de location pour une demande acceptée
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {contractError && (
          <div className="mb-6">
            <ErrorAlert
              type="warning"
              title="Restriction de création de contrat"
              message={contractError.message}
              details={contractError.details}
              onDismiss={() => setContractError(null)}
            />
          </div>
        )}

        {/* Contract Requests Info */}
        {contractRequests.length === 0 ? (
          <Card className="glass-card mb-8">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune demande de contrat</h3>
              <p className="text-muted-foreground mb-4">
                Vous devez d'abord recevoir des offres acceptées où les locataires demandent un contrat.
              </p>
              <p className="text-sm text-muted-foreground">
                Le processus: Locataire fait une offre → Vous acceptez l'offre → Locataire demande un contrat → Vous pouvez créer le contrat
              </p>
              <Button onClick={() => navigate("/offers")} className="mt-4">
                Voir mes offres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Available Contract Requests */}
            <Card className="glass-card mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Info className="h-5 w-5" />
                  <span>Demandes de contrat disponibles ({contractRequests.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {contractRequests.map((request: ContractRequest) => (
                    <div
                      key={request.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedOfferId === request.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => handleOfferSelection(request.id.toString())}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Home className="h-4 w-4" />
                            <h4 className="font-semibold">{request.property.title}</h4>
                            <Badge variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Contrat demandé
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{request.property.address}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{request.tenant.firstName} {request.tenant.lastName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(request.startDate), "dd/MM/yyyy", { locale: fr })} - 
                                {format(new Date(request.endDate), "dd/MM/yyyy", { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{request.monthlyRent} TND/mois</span>
                            </div>
                          </div>
                        </div>
                        {selectedOfferId === request.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contract Form */}
            {selectedOfferId && (
              <form onSubmit={handleSubmit}>
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Détails du Contrat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Owner Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Informations du Propriétaire</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="landlordName">Nom complet *</Label>
                          <Input
                            id="landlordName"
                            value={contractData.landlordName}
                            onChange={(e) => setContractData({ ...contractData, landlordName: e.target.value })}
                            placeholder="Nom et prénom du propriétaire"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="landlordCin">CIN *</Label>
                          <Input
                            id="landlordCin"
                            value={contractData.landlordCin}
                            onChange={(e) => setContractData({ ...contractData, landlordCin: e.target.value })}
                            placeholder="Numéro de CIN"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Tenant Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Informations du Locataire</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tenantName">Nom complet</Label>
                          <Input
                            id="tenantName"
                            value={contractData.tenantName}
                            onChange={(e) => setContractData({ ...contractData, tenantName: e.target.value })}
                            placeholder="Nom et prénom du locataire"
                            disabled
                          />
                        </div>
                        <div>
                          <Label htmlFor="tenantCin">CIN *</Label>
                          <Input
                            id="tenantCin"
                            value={contractData.tenantCin}
                            onChange={(e) => setContractData({ ...contractData, tenantCin: e.target.value })}
                            placeholder="Numéro de CIN du locataire"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Property Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Informations de la Propriété</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="propertyTitle">Titre de la propriété</Label>
                          <Input
                            id="propertyTitle"
                            value={contractData.propertyTitle}
                            disabled
                          />
                        </div>
                        <div>
                          <Label htmlFor="propertyAddress">Adresse</Label>
                          <Input
                            id="propertyAddress"
                            value={contractData.propertyAddress}
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Contract Terms */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Conditions du Contrat</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startDate">Date de début</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={contractData.startDate}
                            onChange={(e) => setContractData({ ...contractData, startDate: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="endDate">Date de fin</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={contractData.endDate}
                            onChange={(e) => setContractData({ ...contractData, endDate: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="monthlyRent">Loyer mensuel (TND)</Label>
                          <Input
                            id="monthlyRent"
                            type="number"
                            value={contractData.monthlyRent}
                            onChange={(e) => setContractData({ ...contractData, monthlyRent: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="deposit">Caution (TND)</Label>
                          <Input
                            id="deposit"
                            type="number"
                            value={contractData.deposit}
                            onChange={(e) => setContractData({ ...contractData, deposit: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentDueDate">Date d'échéance mensuelle</Label>
                          <Select value={contractData.paymentDueDate} onValueChange={(value) => setContractData({ ...contractData, paymentDueDate: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  Le {day} de chaque mois
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Special Conditions */}
                    <div>
                      <Label htmlFor="specialConditions">Conditions spéciales (optionnel)</Label>
                      <Textarea
                        id="specialConditions"
                        value={contractData.specialConditions}
                        onChange={(e) => setContractData({ ...contractData, specialConditions: e.target.value })}
                        placeholder="Conditions spéciales, règles ou notes particulières..."
                        rows={4}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4 pt-6">
                      <Button type="button" variant="outline" onClick={() => navigate("/contracts")}>
                        Annuler
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createContract.isPending}
                        className="flex items-center space-x-2"
                      >
                        <Send className="h-4 w-4" />
                        <span>
                          {createContract.isPending ? "Création..." : "Créer le Contrat"}
                        </span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}