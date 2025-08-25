import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
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
import { MapPin, Home, Bed, Bath, Phone, MessageCircle, Banknote, ArrowLeft, Star, Heart, Share, Calendar, Users, Wifi, Car, Utensils, Tv, Wind, Droplets, ChevronLeft, ChevronRight, ExternalLink, Map, StarIcon, Clock, CheckCircle, XCircle, FileText, Shield, Info, DollarSign, Tag, MapPinned, Navigation, Building2, Armchair, Clock3, CreditCard, Zap } from "lucide-react";
import Header from "@/components/Header";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { NetworkError } from "@/components/ErrorBoundary";



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
  
  // Map state for location display
  const [locationMap, setLocationMap] = useState<any>(null);
  const locationMapRef = useRef<HTMLDivElement>(null);

  const propertyId = params?.id ? parseInt(params.id) : 0;
  const [networkError, setNetworkError] = useState<string | null>(null);

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

  // Initialize read-only location map
  useEffect(() => {
    if (property && property.latitude && property.longitude && locationMapRef.current && !locationMap) {
      initializeLocationMap();
    }
  }, [property, locationMap]);

  const initializeLocationMap = async () => {
    try {
      // Wait for Google Maps to load
      if (!(window as any).google || !(window as any).google.maps) {
        setTimeout(() => initializeLocationMap(), 1000);
        return;
      }

      const google = (window as any).google;
      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);
      
      const mapOptions = {
        center: { lat, lng },
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: true,
        rotateControl: true,
        fullscreenControl: true
      };

      const googleMap = new google.maps.Map(locationMapRef.current, mapOptions);
      
      // Create marker for property location (non-draggable)
      const propertyMarker = new google.maps.Marker({
        position: { lat, lng },
        map: googleMap,
        draggable: false,
        title: property.title,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      setLocationMap(googleMap);
      
    } catch (error) {
      console.error('Error initializing location map:', error);
    }
  };

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
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/search")}
            className="flex items-center space-x-2 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Retour</span>
          </Button>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Property Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Property Images Gallery */}
            {property.images && property.images.length > 0 ? (
              <div className="relative group">
                <div className="aspect-video sm:aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg sm:rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={property.images[currentImageIndex]}
                    alt={`${property.title} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Enhanced navigation arrows */}
                  {property.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 shadow-lg rounded-full h-8 w-8 sm:h-10 sm:w-10 p-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 shadow-lg rounded-full h-8 w-8 sm:h-10 sm:w-10 p-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </>
                  )}
                  
                  {/* Enhanced image counter */}
                  {property.images.length > 1 && (
                    <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black/70 backdrop-blur-sm text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium">
                      📸 {currentImageIndex + 1} / {property.images.length}
                    </div>
                  )}
                  
                  {/* Property status badge */}
                  <div className="absolute top-4 left-4">
                    <Badge 
                      variant={property.status === 'Disponible' ? 'default' : 'secondary'}
                      className={`text-xs font-medium ${
                        property.status === 'Disponible' 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {property.status === 'Disponible' ? '✅ Disponible' : '🔒 Non disponible'}
                    </Badge>
                  </div>
                </div>
                
                {/* Enhanced thumbnails */}
                {property.images.length > 1 && (
                  <div className="flex space-x-3 mt-4 overflow-x-auto pb-2">
                    {property.images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-24 h-20 rounded-lg overflow-hidden border-3 transition-all duration-300 hover:scale-105 ${
                          index === currentImageIndex 
                            ? 'border-primary shadow-lg ring-2 ring-primary/50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${property.title} - Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-50 via-gray-100 to-gray-150 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="mb-4 p-4 bg-gray-100 rounded-full w-fit mx-auto">
                    <Home className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="font-medium text-lg mb-1">📸 Aucune photo disponible</p>
                  <p className="text-sm">Le propriétaire n'a pas encore ajouté de photos</p>
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
                {/* Property Categories & Type */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center space-x-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <span>Type de propriété</span>
                    </h3>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {property.type || 'Non spécifié'}
                    </Badge>
                  </div>
                  
                  {/* Categories */}
                  {property.categories && property.categories.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Catégories</h4>
                      <div className="flex flex-wrap gap-2">
                        {property.categories.map((category: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Geographic Highlight */}
                  {property.geographicHighlight && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center space-x-2">
                        <MapPinned className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Point d'intérêt</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {property.geographicHighlight}
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-lg">Description</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {property.description || 'Aucune description disponible'}
                  </p>
                </div>

                {/* Pricing & Financial Details */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-4 text-lg flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span>Détails financiers</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">Loyer</span>
                      </div>
                      <p className="text-lg font-bold">{property.price} TND</p>
                      <p className="text-sm text-muted-foreground">par {property.priceType || 'mois'}</p>
                    </div>
                    
                    {property.deposit && (
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">Caution</span>
                        </div>
                        <p className="text-lg font-bold">{property.deposit} TND</p>
                        <p className="text-sm text-muted-foreground">Dépôt de garantie</p>
                      </div>
                    )}
                    
                    {property.utilities && (
                      <div className="p-4 rounded-lg bg-muted/50 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-sm">Services publics</span>
                          {property.utilitiesIncluded && (
                            <Badge variant="default" className="text-xs">Inclus</Badge>
                          )}
                        </div>
                        <p className="text-sm">{property.utilities}</p>
                        {!property.utilitiesIncluded && (
                          <p className="text-xs text-muted-foreground mt-1">Non inclus dans le loyer</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-4 text-lg">Équipements & Services</h3>
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

                {/* House Rules */}
                {property.rules && property.rules.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-4 text-lg flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <span>Règlement intérieur</span>
                    </h3>
                    <div className="space-y-2">
                      {property.rules.map((rule: string, index: number) => (
                        <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                          <Info className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <span className="text-sm text-red-800 dark:text-red-200">{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Furnished Status & Furniture Details */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-4 text-lg flex items-center space-x-2">
                    <Armchair className="h-5 w-5 text-primary" />
                    <span>Mobilier</span>
                  </h3>
                  
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-3 h-3 rounded-full ${
                        property.furnished ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium">
                        {property.furnished ? 'Propriété meublée' : 'Propriété non meublée'}
                      </span>
                    </div>
                    
                    {property.furnished && property.furniture && property.furniture.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Meubles inclus :</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {property.furniture.map((furniture: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                              <div className="flex items-center space-x-2">
                                <Armchair className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">{furniture.item}</span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  furniture.condition === 'excellent' ? 'border-green-500 text-green-700' :
                                  furniture.condition === 'bon' ? 'border-blue-500 text-blue-700' :
                                  'border-yellow-500 text-yellow-700'
                                }`}
                              >
                                {furniture.condition === 'excellent' ? '🌟 Excellent' :
                                 furniture.condition === 'bon' ? '👍 Bon état' :
                                 '⚠️ Acceptable'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {property.furnished && (!property.furniture || property.furniture.length === 0) && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Détails du mobilier non spécifiés par le propriétaire.
                      </p>
                    )}
                    
                    {!property.furnished && (
                      <p className="text-sm text-muted-foreground">
                        Cette propriété est proposée vide. Vous devrez apporter vos propres meubles.
                      </p>
                    )}
                  </div>
                </div>

                {/* Availability Details */}
                {property.availability && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-4 text-lg flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span>Disponibilité</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current Status */}
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            property.availability.available ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="font-medium text-sm">
                            {property.availability.available ? 'Actuellement disponible' : 'Actuellement occupé'}
                          </span>
                        </div>
                        
                        {property.availability.availableFrom && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Disponible à partir du :</p>
                            <p className="text-sm font-semibold">
                              {new Date(property.availability.availableFrom).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Stay Duration */}
                      {(property.availability.minimumStay || property.availability.maximumStay) && (
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock3 className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">Durée de séjour</span>
                          </div>
                          
                          <div className="space-y-2">
                            {property.availability.minimumStay && (
                              <div>
                                <p className="text-xs text-muted-foreground">Séjour minimum :</p>
                                <p className="text-sm font-semibold">{property.availability.minimumStay}</p>
                              </div>
                            )}
                            
                            {property.availability.maximumStay && (
                              <div>
                                <p className="text-xs text-muted-foreground">Séjour maximum :</p>
                                <p className="text-sm font-semibold">{property.availability.maximumStay}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {(!property.availability.minimumStay && !property.availability.maximumStay && !property.availability.availableFrom) && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Aucune restriction de durée spécifiée</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Contactez le propriétaire pour discuter des conditions de location.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Location Section */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-4 text-lg flex items-center space-x-2">
                    <Navigation className="h-5 w-5 text-primary" />
                    <span>Localisation exacte</span>
                  </h3>
                  
                  {/* Address Card */}
                  <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-lg">Adresse complète</span>
                        </div>
                        <p className="text-base mb-2">{property.address}</p>
                        
                        {/* Coordinates if available */}
                        {property.latitude && property.longitude && (
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <span>GPS:</span>
                              <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                                {Number(property.latitude).toFixed(6)}, {Number(property.longitude).toFixed(6)}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {property.latitude && property.longitude && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={openMapsLocation}
                          className="flex items-center space-x-2 ml-4"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Ouvrir dans Maps</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Interactive Google Maps */}
                  {property.latitude && property.longitude && (
                    <div className="rounded-lg overflow-hidden border shadow-lg">
                      <div className="relative">
                        <div 
                          ref={locationMapRef}
                          className="w-full h-[400px]"
                          style={{ minHeight: '400px' }}
                        ></div>
                        
                        {/* Loading overlay */}
                        {!locationMap && (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                            <div className="text-center bg-white rounded-lg p-6 shadow-lg">
                              <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-primary mx-auto mb-3"></div>
                              <p className="text-sm font-medium">Chargement de la carte...</p>
                              <p className="text-xs text-muted-foreground mt-1">Localisation de la propriété</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Coordinates Display */}
                        <div className="absolute top-3 right-3 bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono backdrop-blur-sm">
                          📍 {Number(property.latitude).toFixed(6)}, {Number(property.longitude).toFixed(6)}
                        </div>
                      </div>
                      
                      <div className="p-4 bg-muted/30 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Localisation précise de la propriété</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Utilisez les contrôles de la carte pour explorer les alentours
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* No coordinates fallback */}
                  {(!property.latitude || !property.longitude) && (
                    <div className="text-center py-8 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-base font-medium text-muted-foreground mb-1">Position GPS non disponible</p>
                      <p className="text-sm text-muted-foreground">Seule l'adresse textuelle est fournie par le propriétaire</p>
                    </div>
                  )}
                </div>

                {/* Property Information Summary */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-4 text-lg flex items-center space-x-2">
                    <Info className="h-5 w-5 text-primary" />
                    <span>Informations complémentaires</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Property Creation Date */}
                    {property.createdAt && (
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs font-medium text-muted-foreground mb-1">Publié le</p>
                        <p className="text-sm font-semibold">
                          {new Date(property.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    
                    {/* Property ID */}
                    <div className="p-3 rounded-lg bg-muted/30 text-center">
                      <Tag className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs font-medium text-muted-foreground mb-1">Référence</p>
                      <p className="text-sm font-semibold">#{property.id}</p>
                    </div>
                    
                    {/* Last Update */}
                    {property.updatedAt && property.updatedAt !== property.createdAt && (
                      <div className="p-3 rounded-lg bg-muted/30 text-center">
                        <Clock3 className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs font-medium text-muted-foreground mb-1">Mis à jour</p>
                        <p className="text-sm font-semibold">
                          {new Date(property.updatedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

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