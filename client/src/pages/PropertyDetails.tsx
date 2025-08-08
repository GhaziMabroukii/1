import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOfferSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { MapPin, Home, Bed, Bath, Phone, MessageCircle, Banknote, ArrowLeft, Star, Heart, Share, Calendar, Users, Wifi, Car, Utensils, Tv, Wind, Droplets, ChevronLeft, ChevronRight, ExternalLink, Map, StarIcon, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import Header from "@/components/Header";



type OfferFormData = z.infer<typeof insertOfferSchema>;

export default function PropertyDetails() {
  const [, params] = useRoute("/property/:id");
  const [, navigate] = useLocation();
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [messageContent, setMessageContent] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const propertyId = params?.id ? parseInt(params.id) : 0;

  // Get current user from localStorage
  const getUserData = () => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error("Error parsing userData:", e);
        return null;
      }
    }
    return null;
  };
  
  const currentUser = getUserData();

  const { data: property, isLoading, error } = useQuery({
    queryKey: ["/api/properties", propertyId],
    queryFn: () => fetch(`/api/properties/${propertyId}`).then(res => {
      if (!res.ok) {
        throw new Error('Property not found');
      }
      return res.json();
    }),
    enabled: propertyId > 0,
  });

  // Fetch owner information
  const { data: owner } = useQuery({
    queryKey: ["/api/users", property?.ownerId],
    queryFn: () => fetch(`/api/users/${property.ownerId}`).then(res => res.json()),
    enabled: !!property?.ownerId,
  });

  // Fetch property reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/properties", propertyId, "reviews"],
    queryFn: () => fetch(`/api/properties/${propertyId}/reviews`).then(res => res.json()),
    enabled: propertyId > 0,
  });

  // Fetch existing offers for this property and tenant
  const { data: existingOffers = [] } = useQuery({
    queryKey: ["/api/offers", "tenant", propertyId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const response = await fetch(`/api/offers?userId=${currentUser.id}&userType=tenant`);
      const allOffers = await response.json();
      return allOffers.filter((offer: any) => offer.propertyId === propertyId);
    },
    enabled: propertyId > 0 && currentUser?.userType === "tenant",
  });

  const form = useForm({
    resolver: zodResolver(z.object({
      propertyId: z.number(),
      tenantId: z.number(),
      ownerId: z.number(),
      startDate: z.string().transform((val) => new Date(val)),
      endDate: z.string().transform((val) => new Date(val)),
      monthlyRent: z.string(),
      deposit: z.string().optional(),
      conditions: z.string().optional(),
      status: z.string().default("pending"),
    })),
    defaultValues: {
      propertyId: propertyId,
      tenantId: currentUser.id,
      ownerId: property?.ownerId || 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthlyRent: property?.price || "0",
      deposit: property?.deposit || "0",
      conditions: "",
      status: "pending",
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/offers", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      }),
    }),
    onSuccess: () => {
      toast({
        title: "Offre envoyée",
        description: "Votre offre a été envoyée au propriétaire avec succès!",
      });
      setIsOfferDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers", "tenant", propertyId, currentUser.id] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'offre. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: (data: { content: string }) => apiRequest("/api/conversations", {
      method: "POST",
      body: JSON.stringify({
        propertyId: propertyId,
        tenantId: currentUser.id,
        ownerId: property?.ownerId,
        message: data.content,
      }),
    }),
    onSuccess: () => {
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé au propriétaire!",
      });
      setIsMessageDialogOpen(false);
      setMessageContent("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const requestContractMutation = useMutation({
    mutationFn: (offerId: number) => apiRequest(`/api/offers/${offerId}/request-contract`, {
      method: "PUT",
    }),
    onSuccess: () => {
      toast({
        title: "Contrat demandé",
        description: "Votre demande de contrat a été envoyée au propriétaire!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers", "tenant", propertyId, currentUser.id] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de demander le contrat. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const offerData = {
      ...data,
      propertyId: propertyId,
      tenantId: currentUser.id,
      ownerId: property?.ownerId || 0,
    };
    createOfferMutation.mutate(offerData);
  };

  const handlePhoneCall = () => {
    if (owner?.phone) {
      window.open(`tel:${owner.phone}`, '_self');
    } else {
      toast({
        title: "Numéro indisponible",
        description: "Le numéro de téléphone du propriétaire n'est pas disponible.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = () => {
    if (messageContent.trim()) {
      createMessageMutation.mutate({ content: messageContent });
    }
  };

  const openMapsLocation = () => {
    if (property?.latitude && property?.longitude) {
      const mapsUrl = `https://www.google.com/maps?q=${property.latitude},${property.longitude}`;
      window.open(mapsUrl, '_blank');
    } else {
      toast({
        title: "Localisation indisponible",
        description: "Les coordonnées GPS de cette propriété ne sont pas disponibles.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Propriété non trouvée</h1>
          <p className="text-muted-foreground mb-4">
            La propriété avec l'ID {propertyId} n'existe pas ou n'est plus disponible.
          </p>
          <Button onClick={() => navigate("/search")}>Retour à la recherche</Button>
        </div>
      </div>
    );
  }

  // Check offer status for this property
  const pendingOffer = existingOffers.find((offer: any) => offer.status === 'pending');
  const acceptedOffer = existingOffers.find((offer: any) => offer.status === 'accepted');
  const rejectedOffers = existingOffers.filter((offer: any) => offer.status === 'rejected');

  // Only tenants can make offers, and only if they're not the owner and property is available
  const canMakeOffer = currentUser.userType === "tenant" && 
                      property && 
                      property.ownerId !== currentUser.id && 
                      property.status === "Disponible" && 
                      !pendingOffer && 
                      !acceptedOffer;

  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi')) return <Wifi className="h-4 w-4" />;
    if (amenityLower.includes('parking')) return <Car className="h-4 w-4" />;
    if (amenityLower.includes('cuisine')) return <Utensils className="h-4 w-4" />;
    if (amenityLower.includes('tv')) return <Tv className="h-4 w-4" />;
    if (amenityLower.includes('climatisation')) return <Wind className="h-4 w-4" />;
    if (amenityLower.includes('chauffage')) return <Wind className="h-4 w-4" />;
    if (amenityLower.includes('piscine')) return <Droplets className="h-4 w-4" />;
    return <Star className="h-4 w-4" />;
  };

  const nextImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/search")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Property Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Images Gallery */}
            {property.images && property.images.length > 0 ? (
              <div className="relative">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={property.images[currentImageIndex]}
                    alt={`${property.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {property.images.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Image thumbnails */}
                {property.images.length > 1 && (
                  <div className="flex space-x-2 mt-4 overflow-x-auto">
                    {property.images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                          index === currentImageIndex ? 'border-primary' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Pas d'image disponible</p>
                </div>
              </div>
            )}

            {/* Property Details */}
            <Card className="glass">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2 gradient-text">{property.title}</CardTitle>
                    <div className="flex items-center text-muted-foreground mb-4 cursor-pointer hover:text-primary transition-colors" onClick={openMapsLocation}>
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="hover:underline">{property.address}</span>
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </div>
                    <div className="flex items-center space-x-6 mb-4">
                      <div className="flex items-center space-x-2">
                        <Home className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-lg">{property.rooms || 'N/A'}</span>
                        <span className="text-muted-foreground">ch</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Bath className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-lg">{property.bathrooms || 'N/A'}</span>
                        <span className="text-muted-foreground">sdb</span>
                      </div>
                      {property.surface && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-lg">{property.surface}</span>
                          <span className="text-muted-foreground">m²</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={property.status === "Disponible" ? "default" : "secondary"} className="mb-4 text-sm px-3 py-1">
                      {property.status}
                    </Badge>
                    <div className="text-4xl font-bold gradient-text mb-1">
                      {property.price} TND
                    </div>
                    <div className="text-muted-foreground">
                      /{property.priceType || 'mois'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-lg">Description</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {property.description}
                  </p>
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4 text-lg">Équipements</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {property.amenities.map((amenity: string, index: number) => (
                        <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          {getAmenityIcon(amenity)}
                          <span className="text-sm font-medium">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Integrated Maps */}
                {property.latitude && property.longitude && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-4 text-lg">Localisation</h3>
                    <div className="rounded-lg overflow-hidden border">
                      <iframe
                        width="100%"
                        height="300"
                        frameBorder="0"
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOWTgaGzGnE_0M&q=${property.latitude},${property.longitude}&zoom=15`}
                        allowFullScreen
                        className="w-full"
                      />
                      <div className="p-4 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{property.address}</p>
                            <p className="text-sm text-muted-foreground">
                              GPS: {property.latitude}, {property.longitude}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={openMapsLocation}
                            className="flex items-center space-x-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Ouvrir dans Maps</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews Section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Avis et commentaires</h3>
                    {reviews.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {Array.from({length: 5}).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.round(reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({reviews.length} avis)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.slice(0, 3).map((review: any) => (
                        <div key={review.id} className="p-4 rounded-lg bg-muted/30 border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-sm font-medium">U</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">Utilisateur #{review.userId}</p>
                                <div className="flex">
                                  {Array.from({length: 5}).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                      {reviews.length > 3 && (
                        <Button variant="outline" size="sm" className="w-full">
                          Voir tous les avis ({reviews.length})
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Aucun avis pour le moment</p>
                      <p className="text-sm text-muted-foreground">Soyez le premier à laisser un avis!</p>
                    </div>
                  )}

                  {/* Add Review Form */}
                  {currentUser.id && currentUser.id !== property.ownerId && (
                    <Card className="mt-4 glass">
                      <CardHeader>
                        <CardTitle className="text-lg">Laisser un avis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Note</label>
                            <div className="flex space-x-1">
                              {Array.from({length: 5}).map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setReviewRating(i + 1)}
                                  className="transition-colors"
                                >
                                  <Star 
                                    className={`h-6 w-6 ${i < reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`} 
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Commentaire (optionnel)</label>
                            <Textarea
                              placeholder="Partagez votre expérience avec cette propriété..."
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <Button 
                            onClick={async () => {
                              if (reviewRating === 0) {
                                toast({
                                  title: "Note requise",
                                  description: "Veuillez donner une note à cette propriété",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              try {
                                await apiRequest("/api/reviews", {
                                  method: "POST",
                                  body: JSON.stringify({
                                    propertyId: property.id,
                                    userId: currentUser.id,
                                    rating: reviewRating,
                                    comment: reviewComment.trim() || null,
                                  }),
                                });
                                
                                setReviewRating(0);
                                setReviewComment("");
                                queryClient.invalidateQueries({ queryKey: ["/api/properties", propertyId, "reviews"] });
                                
                                toast({
                                  title: "Avis ajouté",
                                  description: "Votre avis a été publié avec succès",
                                });
                              } catch (error) {
                                toast({
                                  title: "Erreur",
                                  description: "Impossible d'ajouter votre avis",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={reviewRating === 0}
                            className="w-full"
                          >
                            Publier l'avis
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Sidebar */}
          <div className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="gradient-text">Contactez le propriétaire</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Make Offer Button or Status Messages */}
                {canMakeOffer && (
                  <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gradient-button" size="lg">
                        <Banknote className="mr-2 h-4 w-4" />
                        Faire une offre
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Faire une offre</DialogTitle>
                        <DialogDescription>
                          Proposez votre offre pour cette propriété au propriétaire
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="monthlyRent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Montant proposé (TND/mois)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={`Prix affiché: ${property.price} TND`}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date de début</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Date de fin</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="conditions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message au propriétaire</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Expliquez pourquoi vous êtes intéressé par cette propriété..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={createOfferMutation.isPending}
                          >
                            {createOfferMutation.isPending ? "Envoi en cours..." : "Envoyer l'offre"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Pending Offer Status */}
                {pendingOffer && (
                  <div className="w-full p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Offre en attente</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Votre offre est en attente de réponse du propriétaire.
                    </p>
                  </div>
                )}

                {/* Accepted Offer Status */}
                {acceptedOffer && (
                  <div className="w-full space-y-3">
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Offre acceptée</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Félicitations! Votre offre a été acceptée.
                      </p>
                    </div>
                    
                    {acceptedOffer.status === 'accepted' && (
                      <Button 
                        className="w-full gradient-button" 
                        size="lg"
                        onClick={() => requestContractMutation.mutate(acceptedOffer.id)}
                        disabled={requestContractMutation.isPending}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {requestContractMutation.isPending ? "Demande en cours..." : "Demander le contrat"}
                      </Button>
                    )}

                    {acceptedOffer.status === 'contract_requested' && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Contrat demandé</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Votre demande de contrat a été envoyée au propriétaire.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejected Offer Status */}
                {rejectedOffers.length > 0 && !pendingOffer && !acceptedOffer && (
                  <div className="w-full p-4 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">Offre refusée</span>
                    </div>
                    <p className="text-sm text-red-700">
                      Votre dernière offre a été refusée. Vous pouvez faire une nouvelle offre.
                    </p>
                  </div>
                )}

                {/* Contact Buttons */}
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handlePhoneCall}
                    disabled={!owner?.phone}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Appeler{owner?.phone ? ` ${owner.phone}` : ''}
                  </Button>

                  <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/messages?propertyId=${property.id}&ownerId=${property.ownerId}`)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Envoyer un message</DialogTitle>
                        <DialogDescription>
                          Contactez le propriétaire pour obtenir plus d'informations
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Tapez votre message ici..."
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          rows={4}
                        />
                        <Button 
                          onClick={handleSendMessage}
                          className="w-full"
                          disabled={!messageContent.trim() || createMessageMutation.isPending}
                        >
                          {createMessageMutation.isPending ? "Envoi en cours..." : "Envoyer le message"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Owner Info */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Propriétaire</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 gradient-button rounded-full flex items-center justify-center text-white font-semibold">
                      {owner?.firstName?.[0] || owner?.username?.[0] || property.ownerId}
                    </div>
                    <div>
                      <p className="font-medium">
                        {owner?.firstName && owner?.lastName 
                          ? `${owner.firstName} ${owner.lastName}` 
                          : owner?.username || `Propriétaire #${property.ownerId}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {property.status === "Disponible" ? "Disponible pour contact" : "Propriété occupée"}
                      </p>
                      {owner?.phone && (
                        <p className="text-sm text-muted-foreground">{owner.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}