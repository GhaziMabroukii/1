import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, MessageCircle, Clock, CheckCircle, XCircle, ArrowRightLeft } from "lucide-react";

interface PriceNegotiationModalProps {
  property: {
    id: number;
    title: string;
    price: string;
    ownerId: number;
  };
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  currentUserId: number;
  trigger?: React.ReactNode;
}

interface Negotiation {
  id: number;
  originalPrice: string;
  proposedPrice: string;
  counterPrice?: string;
  status: string;
  message?: string;
  responseMessage?: string;
  createdAt: string;
  respondedAt?: string;
}

const PriceNegotiationModal = ({ 
  property, 
  isOpen = false, 
  onOpenChange, 
  currentUserId, 
  trigger 
}: PriceNegotiationModalProps) => {
  const [open, setOpen] = useState(isOpen);
  const [proposedPrice, setProposedPrice] = useState("");
  const [message, setMessage] = useState("");
  const [counterPrice, setCounterPrice] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const { toast } = useToast();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (newOpen) {
      fetchNegotiations();
    }
  };

  const fetchNegotiations = async () => {
    try {
      const response = await fetch(`/api/negotiations?propertyId=${property.id}&userId=${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        setNegotiations(data);
      }
    } catch (error) {
      console.error("Failed to fetch negotiations:", error);
    }
  };

  const handleSubmitNegotiation = async () => {
    if (!proposedPrice || parseFloat(proposedPrice) <= 0) {
      toast({
        title: "Prix invalide",
        description: "Veuillez entrer un prix valide",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const negotiationData = {
        propertyId: property.id,
        tenantId: currentUserId,
        ownerId: property.ownerId,
        originalPrice: property.price,
        proposedPrice: proposedPrice,
        message: message.trim() || null
      };

      const response = await fetch('/api/negotiations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(negotiationData),
      });

      if (response.ok) {
        toast({
          title: "Négociation envoyée",
          description: "Votre proposition de prix a été envoyée au propriétaire",
        });
        
        setProposedPrice("");
        setMessage("");
        fetchNegotiations();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'envoyer la négociation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToNegotiation = async (negotiationId: number, status: string) => {
    if (status === 'counter_offered' && (!counterPrice || parseFloat(counterPrice) <= 0)) {
      toast({
        title: "Prix invalide",
        description: "Veuillez entrer un prix de contre-proposition valide",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/negotiations/${negotiationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          counterPrice: status === 'counter_offered' ? counterPrice : undefined,
          responseMessage: responseMessage.trim() || undefined
        }),
      });

      if (response.ok) {
        const statusText = {
          'accepted': 'acceptée',
          'rejected': 'refusée',
          'counter_offered': 'contre-proposée'
        }[status] || 'mise à jour';

        toast({
          title: "Négociation " + statusText,
          description: `La négociation a été ${statusText} avec succès`,
        });
        
        setCounterPrice("");
        setResponseMessage("");
        setSelectedNegotiation(null);
        fetchNegotiations();
      } else {
        throw new Error('Erreur lors de la réponse');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de répondre à la négociation",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'counter_offered':
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Acceptée';
      case 'rejected':
        return 'Refusée';
      case 'counter_offered':
        return 'Contre-proposée';
      default:
        return 'Inconnue';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'counter_offered':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const isOwner = currentUserId === property.ownerId;
  const hasActivePendingNegotiation = negotiations.some(n => n.status === 'pending');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="outline" 
            className="w-full"
            data-testid="button-negotiate-price"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Négocier le prix
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Négociation de prix - {property.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Prix actuel: <span className="font-semibold text-primary">{property.price} TND/mois</span>
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Negotiations */}
          {negotiations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">Négociations existantes</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {negotiations.map((negotiation) => (
                  <Card key={negotiation.id} className="p-0">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={getStatusColor(negotiation.status)}>
                              {getStatusIcon(negotiation.status)}
                              <span className="ml-1">{getStatusText(negotiation.status)}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(negotiation.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Prix original:</span>
                              <span className="ml-2 font-medium">{negotiation.originalPrice} TND</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Prix proposé:</span>
                              <span className="ml-2 font-medium text-blue-600">{negotiation.proposedPrice} TND</span>
                            </div>
                            {negotiation.counterPrice && (
                              <div>
                                <span className="text-muted-foreground">Contre-proposition:</span>
                                <span className="ml-2 font-medium text-green-600">{negotiation.counterPrice} TND</span>
                              </div>
                            )}
                          </div>

                          {negotiation.message && (
                            <div className="mt-2">
                              <span className="text-muted-foreground text-sm">Message:</span>
                              <p className="text-sm italic mt-1 bg-gray-50 p-2 rounded">{negotiation.message}</p>
                            </div>
                          )}

                          {negotiation.responseMessage && (
                            <div className="mt-2">
                              <span className="text-muted-foreground text-sm">Réponse:</span>
                              <p className="text-sm italic mt-1 bg-blue-50 p-2 rounded">{negotiation.responseMessage}</p>
                            </div>
                          )}
                        </div>

                        {/* Owner response options */}
                        {isOwner && negotiation.status === 'pending' && (
                          <div className="ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedNegotiation(negotiation)}
                              data-testid={`button-respond-negotiation-${negotiation.id}`}
                            >
                              Répondre
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* New Negotiation Form (Tenant only) */}
          {!isOwner && !hasActivePendingNegotiation && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Proposer un nouveau prix</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="proposed-price">Prix proposé (TND/mois)</Label>
                  <Input
                    id="proposed-price"
                    type="number"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    placeholder="Ex: 800"
                    min="1"
                    step="50"
                    data-testid="input-proposed-price"
                  />
                </div>

                <div>
                  <Label htmlFor="negotiation-message">Message (optionnel)</Label>
                  <Textarea
                    id="negotiation-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Expliquez votre proposition..."
                    maxLength={500}
                    data-testid="textarea-negotiation-message"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.length}/500 caractères
                  </p>
                </div>

                <Button 
                  onClick={handleSubmitNegotiation} 
                  disabled={loading}
                  className="w-full"
                  data-testid="button-submit-negotiation"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {loading ? "Envoi en cours..." : "Envoyer la proposition"}
                </Button>
              </div>
            </div>
          )}

          {/* Pending negotiation message for tenants */}
          {!isOwner && hasActivePendingNegotiation && (
            <div className="text-center py-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-semibold text-yellow-700 mb-1">Négociation en attente</h3>
                <p className="text-yellow-600 text-sm">
                  Vous avez déjà une négociation en cours. Attendez la réponse du propriétaire.
                </p>
              </div>
            </div>
          )}

          {/* Owner message when no negotiations */}
          {isOwner && negotiations.length === 0 && (
            <div className="text-center py-6">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-muted-foreground">
                Aucune négociation pour cette propriété
              </p>
            </div>
          )}
        </div>

        {/* Response Modal for Owner */}
        {selectedNegotiation && (
          <Dialog open={!!selectedNegotiation} onOpenChange={() => setSelectedNegotiation(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Répondre à la négociation</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">
                    <span className="font-medium">Prix proposé:</span> {selectedNegotiation.proposedPrice} TND
                  </p>
                  {selectedNegotiation.message && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Message:</span> {selectedNegotiation.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="counter-price">Contre-proposition (optionnel)</Label>
                  <Input
                    id="counter-price"
                    type="number"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    placeholder="Nouveau prix proposé"
                    min="1"
                    step="50"
                    data-testid="input-counter-price"
                  />
                </div>

                <div>
                  <Label htmlFor="response-message">Message de réponse (optionnel)</Label>
                  <Textarea
                    id="response-message"
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Votre réponse..."
                    maxLength={300}
                    data-testid="textarea-response-message"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleRespondToNegotiation(selectedNegotiation.id, 'accepted')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="button-accept-negotiation"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accepter
                  </Button>
                  
                  {counterPrice && (
                    <Button 
                      onClick={() => handleRespondToNegotiation(selectedNegotiation.id, 'counter_offered')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      data-testid="button-counter-offer"
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Contre-proposer
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => handleRespondToNegotiation(selectedNegotiation.id, 'rejected')}
                    variant="destructive"
                    className="flex-1"
                    data-testid="button-reject-negotiation"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PriceNegotiationModal;