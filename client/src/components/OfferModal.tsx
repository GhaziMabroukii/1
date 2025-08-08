import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, HandHeart } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Property {
  id: number;
  title: string;
  price: string;
  ownerId: number;
}

interface OfferModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export default function OfferModal({ property, isOpen, onClose }: OfferModalProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [monthlyRent, setMonthlyRent] = useState(property.price);
  const [deposit, setDeposit] = useState(property.price);
  const [conditions, setConditions] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const offerMutation = useMutation({
    mutationFn: async (offerData: any) => {
      return await apiRequest("/api/offers", {
        method: "POST",
        body: JSON.stringify(offerData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Offre envoyée",
        description: "Votre offre a été transmise au propriétaire",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'offre",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setMonthlyRent(property.price);
    setDeposit(property.price);
    setConditions("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast({
        title: "Dates requises",
        description: "Veuillez sélectionner les dates de début et fin",
        variant: "destructive",
      });
      return;
    }

    // Mock current user - replace with real auth
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || '{"id": 1}');

    const offerData = {
      propertyId: property.id,
      tenantId: currentUser.id,
      ownerId: property.ownerId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      monthlyRent: parseFloat(monthlyRent),
      deposit: parseFloat(deposit),
      conditions: conditions || undefined,
    };

    offerMutation.mutate(offerData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <HandHeart className="h-5 w-5 text-primary" />
            <span>Faire une offre</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Propriété</Label>
            <p className="text-sm text-muted-foreground">{property.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="end-date">Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthly-rent">Loyer mensuel (€)</Label>
              <Input
                id="monthly-rent"
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                min="0"
                step="10"
                required
              />
            </div>

            <div>
              <Label htmlFor="deposit">Dépôt de garantie (€)</Label>
              <Input
                id="deposit"
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                min="0"
                step="10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="conditions">Conditions particulières (optionnel)</Label>
            <Textarea
              id="conditions"
              placeholder="Précisez vos conditions ou demandes particulières..."
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={offerMutation.isPending}>
              {offerMutation.isPending ? "Envoi..." : "Envoyer l'offre"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}