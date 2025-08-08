import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import Header from "@/components/Header";

export default function Messages() {
  const [, navigate] = useLocation();
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || '{"id": 1, "userType": "tenant"}');

  // Get query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = parseInt(urlParams.get("propertyId") || "0");
  const ownerId = parseInt(urlParams.get("ownerId") || "0");

  // Fetch property details
  const { data: property } = useQuery({
    queryKey: ["/api/properties", propertyId],
    queryFn: () => fetch(`/api/properties/${propertyId}`).then(res => res.json()),
    enabled: propertyId > 0,
  });

  // Fetch owner details
  const { data: owner } = useQuery({
    queryKey: ["/api/users", ownerId],
    queryFn: () => fetch(`/api/users/${ownerId}`).then(res => res.json()),
    enabled: ownerId > 0,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (messageData: { propertyId: number; tenantId: number; ownerId: number; message: string }) => {
      return await apiRequest("/api/conversations", {
        method: "POST",
        body: JSON.stringify(messageData),
      });
    },
    onSuccess: () => {
      setMessage("");
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
      // Navigate to conversations list or stay on page
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessage.mutate({
      propertyId,
      tenantId: currentUser.id,
      ownerId,
      message: message.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/property/${propertyId}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la propriété
          </Button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Messages</h1>
            <p className="text-muted-foreground">
              Conversation avec le propriétaire
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Property and Owner Info */}
          {property && owner && (
            <Card className="mb-6 glass">
              <CardHeader>
                <CardTitle className="text-lg">À propos de cette propriété</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{property.title}</h3>
                    <p className="text-muted-foreground">{property.address}</p>
                    <p className="font-bold text-primary text-xl mt-2">{property.price} TND/mois</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Propriétaire</p>
                    <p className="text-muted-foreground">{owner.firstName} {owner.lastName}</p>
                    <p className="text-sm text-muted-foreground">{owner.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Form */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Envoyer un message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Tapez votre message ici..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Le propriétaire recevra votre message et pourra vous répondre
                  </p>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessage.isPending}
                    className="min-w-24"
                  >
                    {sendMessage.isPending ? (
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message sent confirmation */}
          {sendMessage.isSuccess && (
            <Card className="mt-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-3">
                    <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Message envoyé avec succès !
                  </h3>
                  <p className="text-green-600 dark:text-green-300 text-sm">
                    Le propriétaire recevra une notification et pourra vous répondre.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}