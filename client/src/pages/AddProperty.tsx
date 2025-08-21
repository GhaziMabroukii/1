import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  MapPin, 
  Upload, 
  Plus, 
  X,
  Wifi,
  Car,
  Bed,
  Bath,
  Square,
  GraduationCap,
  Users,
  Waves,
  Mountain,
  Tent,
  Sofa,
  ChefHat,
  Tv,
  Shirt,
  Navigation,
  Map,
  Type,
  Heart,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AddProperty = () => {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    description: "",
    price: "",
    priceType: "mois",
    surface: "",
    rooms: "",
    bathrooms: "",
    address: "",
    location: { lat: 0, lng: 0 },
    locationMethod: "" as "current" | "map" | "text",
    amenities: [] as string[],
    rules: [] as string[],
    images: [] as File[],
    category: "" as "student" | "family" | "summer" | "mountain" | "camping",
    categoryDetails: {
      faculty: "",
      distanceToFaculty: "",
      distanceUnit: "km" as "m" | "km" | "min_walk" | "min_car",
      beach: "",
      mountainInfo: "",
      campingInfo: ""
    },
    furnished: false,
    furniture: [] as Array<{item: string, condition: "excellent" | "bon" | "acceptable"}>,
    availability: {
      available: true,
      availableFrom: "",
      minimumStay: "",
      maximumStay: ""
    },
    pricing: {
      deposit: "",
      utilities: "",
      utilitiesIncluded: false
    }
  });

  const [newRule, setNewRule] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated and is an owner
    const isAuth = localStorage.getItem("isAuthenticated");
    const userType = localStorage.getItem("userType");
    
    if (!isAuth) {
      navigate("/login");
      return;
    }
    
    if (userType !== "owner") {
      toast({
        title: "Accès refusé",
        description: "Seuls les propriétaires peuvent ajouter des biens",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
  }, [navigate, toast]);

  const availableAmenities = [
    { id: "wifi", label: "Wi-Fi gratuit", icon: <Wifi className="h-4 w-4" /> },
    { id: "parking", label: "Parking", icon: <Car className="h-4 w-4" /> },
    { id: "AC", label: "Climatisation", icon: <span>❄️</span> },
    { id: "washing_machine", label: "Lave-linge", icon: <span>🫧</span> },
    { id: "garden", label: "Jardin", icon: <span>🌿</span> },
    { id: "security", label: "Sécurité", icon: <span>🔒</span> },
    { id: "elevator", label: "Ascenseur", icon: <span>🛗</span> },
    { id: "balcony", label: "Balcon", icon: <span>🏠</span> },
    { id: "kitchen", label: "Cuisine équipée", icon: <ChefHat className="h-4 w-4" /> }
  ];

  const propertyCategories = [
    { id: "student", label: "Étudiant", icon: <GraduationCap className="h-5 w-5" />, description: "Logement pour étudiants" },
    { id: "family", label: "Famille", icon: <Users className="h-5 w-5" />, description: "Logement familial" },
    { id: "summer", label: "Maison d'été", icon: <Waves className="h-5 w-5" />, description: "Résidence de vacances" },
    { id: "mountain", label: "Montagne", icon: <Mountain className="h-5 w-5" />, description: "Logement en montagne" },
    { id: "camping", label: "Camping", icon: <Tent className="h-5 w-5" />, description: "Emplacement camping" }
  ];

  const furnitureItems = [
    { id: "bed", label: "Lit", icon: <Bed className="h-4 w-4" /> },
    { id: "sofa", label: "Canapé", icon: <Sofa className="h-4 w-4" /> },
    { id: "table", label: "Table", icon: <span>🪑</span> },
    { id: "chairs", label: "Chaises", icon: <span>🪑</span> },
    { id: "wardrobe", label: "Armoire", icon: <Shirt className="h-4 w-4" /> },
    { id: "tv", label: "Télévision", icon: <Tv className="h-4 w-4" /> },
    { id: "fridge", label: "Réfrigérateur", icon: <span>🧊</span> },
    { id: "microwave", label: "Micro-ondes", icon: <span>📱</span> },
    { id: "desk", label: "Bureau", icon: <span>🖥️</span> }
  ];

  const propertyTypes = [
    { value: "studio", label: "Studio" },
    { value: "apartment", label: "Appartement" },
    { value: "villa", label: "Villa" },
    { value: "house", label: "Maison" },
    { value: "vacation", label: "Maison de vacances" },
    { value: "room", label: "Chambre" },
    { value: "office", label: "Bureau" },
    { value: "shop", label: "Local commercial" }
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const toggleAmenity = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const addRule = () => {
    if (newRule.trim()) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule("");
    }
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 10) // Max 10 images
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleLocationMethod = (method: "current" | "map" | "text") => {
    handleInputChange('locationMethod', method);
    
    if (method === "current") {
      // Reset manual address when using current position
      handleInputChange('address', '');
      if (navigator.geolocation) {
        toast({
          title: "Obtention de votre position...",
          description: "Veuillez patienter",
        });
        navigator.geolocation.getCurrentPosition(
          (position) => {
            handleInputChange('location', {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            // Set a reverse geocoded address (mock for now)
            handleInputChange('address', `Position GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
            toast({
              title: "✓ Position actuelle définie",
              description: "Votre position GPS a été utilisée automatiquement",
            });
          },
          () => {
            toast({
              title: "Erreur de géolocalisation",
              description: "Impossible d'obtenir votre position. Vérifiez les permissions de votre navigateur.",
              variant: "destructive",
            });
            handleInputChange('locationMethod', '');
          }
        );
      } else {
        toast({
          title: "Géolocalisation non supportée",
          description: "Votre navigateur ne supporte pas la géolocalisation",
          variant: "destructive",
        });
        handleInputChange('locationMethod', '');
      }
    } else if (method === "map") {
      // Reset manual address when using map
      handleInputChange('address', '');
      // Map will be shown in the UI, no immediate action needed
      toast({
        title: "Carte activée",
        description: "Cliquez sur la carte ci-dessous pour définir la position",
      });
    } else if (method === "text") {
      // Reset GPS coordinates when using manual input
      handleInputChange('location', { lat: 0, lng: 0 });
      handleInputChange('address', '');
      toast({
        title: "Saisie manuelle activée",
        description: "Saisissez l'adresse complète dans le champ ci-dessous",
      });
    }
  };

  const validateManualAddress = (address: string) => {
    // Simple validation for Tunisian addresses
    const tunisianCities = ['tunis', 'sfax', 'sousse', 'kairouan', 'bizerte', 'gabes', 'ariana', 'monastir', 'nabeul', 'kasserine', 'hammamet', 'ben arous', 'manouba'];
    const hasCity = tunisianCities.some(city => address.toLowerCase().includes(city));
    
    if (address.length < 10) {
      return { valid: false, message: "L'adresse doit contenir au moins 10 caractères" };
    }
    
    if (!hasCity) {
      return { valid: false, message: "L'adresse doit contenir une ville tunisienne reconnue" };
    }
    
    return { valid: true, message: "Adresse validée" };
  };

  const handleManualAddressChange = (address: string) => {
    handleInputChange('address', address);
    
    if (formData.locationMethod === 'text' && address.length > 5) {
      const validation = validateManualAddress(address);
      if (validation.valid) {
        toast({
          title: "✓ " + validation.message,
          description: "Adresse acceptée",
        });
      }
    }
  };

  // Tunisian cities with approximate coordinates
  const tunisianCities = [
    { name: "Tunis", lat: 36.8065, lng: 10.1815, region: "Nord" },
    { name: "Sfax", lat: 34.7406, lng: 10.7603, region: "Centre" },
    { name: "Sousse", lat: 35.8256, lng: 10.6367, region: "Centre" },
    { name: "Kairouan", lat: 35.6781, lng: 10.0963, region: "Centre" },
    { name: "Bizerte", lat: 37.2746, lng: 9.8739, region: "Nord" },
    { name: "Gabès", lat: 33.8815, lng: 10.0982, region: "Sud" },
    { name: "Ariana", lat: 36.8625, lng: 10.1950, region: "Nord" },
    { name: "Monastir", lat: 35.7777, lng: 10.8261, region: "Centre" },
    { name: "Nabeul", lat: 36.4560, lng: 10.7376, region: "Nord" },
    { name: "Ben Arous", lat: 36.7539, lng: 10.2278, region: "Nord" },
    { name: "Kasserine", lat: 35.1677, lng: 8.8366, region: "Centre" },
    { name: "Hammamet", lat: 36.4000, lng: 10.6167, region: "Nord" },
    { name: "Tozeur", lat: 33.9197, lng: 8.1339, region: "Sud" },
    { name: "Mahdia", lat: 35.5047, lng: 11.0624, region: "Centre" },
    { name: "Djerba", lat: 33.8076, lng: 10.8451, region: "Sud" }
  ];

  const [mapZoom, setMapZoom] = useState(1);
  const [mapCenter, setMapCenter] = useState({ lat: 34.7406, lng: 10.1815 }); // Center of Tunisia
  const [showSatellite, setShowSatellite] = useState(true);

  const handleMapCityClick = (city: typeof tunisianCities[0]) => {
    // Zoom into the selected city
    setMapCenter({ lat: city.lat, lng: city.lng });
    setMapZoom(3); // Zoom in for precise positioning
    toast({
      title: `Zoom sur ${city.name}`,
      description: "Cliquez maintenant à l'endroit exact de votre bien",
    });
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (formData.locationMethod !== 'map') return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    // Convert click position to coordinates relative to current view
    const viewWidth = 5 / mapZoom; // Longitude range visible
    const viewHeight = 8 / mapZoom; // Latitude range visible
    
    const clickLat = mapCenter.lat + (viewHeight / 2) - (y / 100) * viewHeight;
    const clickLng = mapCenter.lng - (viewWidth / 2) + (x / 100) * viewWidth;
    
    // Validate coordinates are in Tunisia
    if (clickLat >= 30 && clickLat <= 38 && clickLng >= 7 && clickLng <= 12) {
      handleInputChange('location', {
        lat: clickLat,
        lng: clickLng
      });
      
      // Find nearest city for address
      const nearestCity = tunisianCities.reduce((nearest, city) => {
        const distance = Math.sqrt(
          Math.pow(city.lat - clickLat, 2) + Math.pow(city.lng - clickLng, 2)
        );
        const nearestDistance = Math.sqrt(
          Math.pow(nearest.lat - clickLat, 2) + Math.pow(nearest.lng - clickLng, 2)
        );
        return distance < nearestDistance ? city : nearest;
      });
      
      handleInputChange('address', `Près de ${nearestCity.name}, ${nearestCity.region}, Tunisie`);
      
      toast({
        title: "✓ Position exacte définie",
        description: `Coordonnées: ${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}`,
      });
    } else {
      toast({
        title: "Position invalide",
        description: "Veuillez cliquer à l'intérieur de la Tunisie",
        variant: "destructive",
      });
    }
  };

  const zoomIn = () => setMapZoom(Math.min(mapZoom * 1.5, 8));
  const zoomOut = () => setMapZoom(Math.max(mapZoom / 1.5, 0.5));
  const resetView = () => {
    setMapZoom(1);
    setMapCenter({ lat: 34.7406, lng: 10.1815 });
  };

  const addFurniture = (itemId: string) => {
    if (!formData.furniture.find(f => f.item === itemId)) {
      setFormData(prev => ({
        ...prev,
        furniture: [...prev.furniture, { item: itemId, condition: "bon" }]
      }));
    }
  };

  const removeFurniture = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      furniture: prev.furniture.filter(f => f.item !== itemId)
    }));
  };

  const updateFurnitureCondition = (itemId: string, condition: "excellent" | "bon" | "acceptable") => {
    setFormData(prev => ({
      ...prev,
      furniture: prev.furniture.map(f => 
        f.item === itemId ? { ...f, condition } : f
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.type || !formData.price || !formData.address) {
      toast({
        title: "Champs requis manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user data
      const currentUser = JSON.parse(localStorage.getItem("userData") || "{}");
      
      console.log("Current user:", currentUser);
      console.log("Form data before processing:", formData);

      // Validate that we have a valid user
      if (!currentUser.id) {
        throw new Error("User not logged in");
      }
      
      // Prepare property data for API (ensuring correct types for Drizzle schema)
      // Enhanced validation
      if (formData.locationMethod === 'text' && !validateManualAddress(formData.address).valid) {
        toast({
          title: "Adresse invalide",
          description: validateManualAddress(formData.address).message,
          variant: "destructive",
        });
        return;
      }

      if (!formData.locationMethod) {
        toast({
          title: "Méthode de localisation requise",
          description: "Veuillez choisir une méthode de localisation",
          variant: "destructive",
        });
        return;
      }

      if (formData.locationMethod !== 'text' && formData.location.lat === 0) {
        toast({
          title: "Position non définie",
          description: "Veuillez définir la position de votre bien",
          variant: "destructive",
        });
        return;
      }

      const propertyData = {
        ownerId: currentUser.id,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        price: formData.price,
        priceType: formData.priceType,
        surface: formData.surface ? parseInt(formData.surface) : null,
        rooms: formData.rooms ? parseInt(formData.rooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        address: formData.address,
        latitude: formData.location.lat !== 0 ? formData.location.lat.toString() : null,
        longitude: formData.location.lng !== 0 ? formData.location.lng.toString() : null,
        amenities: formData.amenities.length > 0 ? formData.amenities : null,
        rules: formData.rules.length > 0 ? formData.rules : null,
        categories: formData.category ? [formData.category] : null,
        deposit: formData.pricing.deposit || null,
        utilities: formData.pricing.utilities || null,
        utilitiesIncluded: formData.pricing.utilitiesIncluded,
        status: "Disponible",
        // Add category-specific details to description
        geographicHighlight: formData.category === 'student' && formData.categoryDetails.faculty ? 
          `À ${formData.categoryDetails.distanceToFaculty}${formData.categoryDetails.distanceUnit === 'min_walk' ? ' min à pied' : formData.categoryDetails.distanceUnit === 'min_car' ? ' min en voiture' : formData.categoryDetails.distanceUnit} de ${formData.categoryDetails.faculty}` :
          formData.category === 'summer' && formData.categoryDetails.beach ? `Près de la plage ${formData.categoryDetails.beach}` :
          formData.category === 'mountain' && formData.categoryDetails.mountainInfo ? formData.categoryDetails.mountainInfo :
          formData.category === 'camping' && formData.categoryDetails.campingInfo ? formData.categoryDetails.campingInfo : null
      };

      console.log("Property data being sent to API:", JSON.stringify(propertyData, null, 2));

      // Debug: Let's also test the validation schema
      try {
        const { insertPropertySchema } = await import("@/../../shared/schema");
        const validated = insertPropertySchema.parse(propertyData);
        console.log("Frontend validation passed:", validated);
      } catch (validationError) {
        console.error("Frontend validation failed:", validationError);
      }

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log("API Error Response:", JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error || "Failed to create property");
      }

      const createdProperty = await response.json();

      toast({
        title: "Bien ajouté avec succès!",
        description: "Votre bien est maintenant disponible à la location",
      });

      navigate("/manage-properties");
    } catch (error) {
      console.error("Error creating property:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le bien",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text flex items-center space-x-3">
            <Plus className="h-8 w-8 text-primary" />
            <span>Ajouter un bien</span>
          </h1>
          <p className="text-muted-foreground">
            Publiez votre propriété et trouvez des locataires
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre de l'annonce *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Studio moderne près INSAT"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type de bien *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="surface">Surface (m²) *</Label>
                    <Input
                      id="surface"
                      type="number"
                      value={formData.surface}
                      onChange={(e) => handleInputChange('surface', e.target.value)}
                      placeholder="35"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rooms">Nombre de pièces</Label>
                    <Input
                      id="rooms"
                      type="number"
                      value={formData.rooms}
                      onChange={(e) => handleInputChange('rooms', e.target.value)}
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Salles de bain</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Décrivez votre bien..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Category Selection */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Catégorie du bien</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {propertyCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleInputChange('category', category.id)}
                      className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                        formData.category === category.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className={`p-2 rounded-full ${
                          formData.category === category.id ? "bg-primary text-white" : "bg-gray-100"
                        }`}>
                          {category.icon}
                        </div>
                        <h3 className="font-semibold">{category.label}</h3>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Category-specific fields */}
                {formData.category === 'student' && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-4">
                    <h4 className="font-semibold text-blue-800 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Informations étudiant
                    </h4>
                    <div>
                      <Label htmlFor="faculty">Faculté/École la plus proche</Label>
                      <Input
                        id="faculty"
                        value={formData.categoryDetails.faculty}
                        onChange={(e) => handleInputChange('categoryDetails.faculty', e.target.value)}
                        placeholder="INSAT, ENIT, FST..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="distance">Distance</Label>
                        <Input
                          id="distance"
                          value={formData.categoryDetails.distanceToFaculty}
                          onChange={(e) => handleInputChange('categoryDetails.distanceToFaculty', e.target.value)}
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit">Unité</Label>
                        <Select value={formData.categoryDetails.distanceUnit} onValueChange={(value) => handleInputChange('categoryDetails.distanceUnit', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="m">mètres</SelectItem>
                            <SelectItem value="km">kilomètres</SelectItem>
                            <SelectItem value="min_walk">min à pied</SelectItem>
                            <SelectItem value="min_car">min en voiture</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {formData.category === 'summer' && (
                  <div className="mt-6 p-4 bg-cyan-50 rounded-lg space-y-4">
                    <h4 className="font-semibold text-cyan-800 flex items-center">
                      <Waves className="h-4 w-4 mr-2" />
                      Informations vacances
                    </h4>
                    <div>
                      <Label htmlFor="beach">Plage la plus proche</Label>
                      <Input
                        id="beach"
                        value={formData.categoryDetails.beach}
                        onChange={(e) => handleInputChange('categoryDetails.beach', e.target.value)}
                        placeholder="Sidi Bou Said, Hammamet, Sousse..."
                      />
                    </div>
                  </div>
                )}

                {formData.category === 'mountain' && (
                  <div className="mt-6 p-4 bg-green-50 rounded-lg space-y-4">
                    <h4 className="font-semibold text-green-800 flex items-center">
                      <Mountain className="h-4 w-4 mr-2" />
                      Informations montagne
                    </h4>
                    <div>
                      <Label htmlFor="mountainInfo">Informations sur la région</Label>
                      <Input
                        id="mountainInfo"
                        value={formData.categoryDetails.mountainInfo}
                        onChange={(e) => handleInputChange('categoryDetails.mountainInfo', e.target.value)}
                        placeholder="Région de Zaghouan, vue sur les montagnes..."
                      />
                    </div>
                  </div>
                )}

                {formData.category === 'camping' && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-lg space-y-4">
                    <h4 className="font-semibold text-amber-800 flex items-center">
                      <Tent className="h-4 w-4 mr-2" />
                      Informations camping
                    </h4>
                    <div>
                      <Label htmlFor="campingInfo">Détails du camping</Label>
                      <Input
                        id="campingInfo"
                        value={formData.categoryDetails.campingInfo}
                        onChange={(e) => handleInputChange('categoryDetails.campingInfo', e.target.value)}
                        placeholder="Emplacement avec électricité, sanitaires..."
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Localisation</CardTitle>
                <p className="text-sm text-muted-foreground">Choisissez la méthode de localisation</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    type="button"
                    variant={formData.locationMethod === 'current' ? 'default' : 'outline'}
                    onClick={() => handleLocationMethod('current')}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <Navigation className="h-6 w-6" />
                    <span className="text-sm font-medium">Position actuelle</span>
                    <span className="text-xs text-center">Utiliser ma position</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant={formData.locationMethod === 'map' ? 'default' : 'outline'}
                    onClick={() => handleLocationMethod('map')}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <Map className="h-6 w-6" />
                    <span className="text-sm font-medium">Sur la carte</span>
                    <span className="text-xs text-center">Pointer sur carte</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant={formData.locationMethod === 'text' ? 'default' : 'outline'}
                    onClick={() => handleLocationMethod('text')}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <Type className="h-6 w-6" />
                    <span className="text-sm font-medium">Saisie manuelle</span>
                    <span className="text-xs text-center">Écrire l'adresse</span>
                  </Button>
                </div>

                {/* Dynamic address field based on location method */}
                {formData.locationMethod === 'text' && (
                  <div>
                    <Label htmlFor="address" className="text-base font-medium flex items-center space-x-2">
                      <Type className="h-4 w-4" />
                      <span>Saisir l'adresse complète *</span>
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleManualAddressChange(e.target.value)}
                      placeholder="Ex: Avenue Habib Bourguiba, Tunis 1001"
                      required
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Incluez la rue, la ville et le code postal pour une meilleure précision
                    </p>
                  </div>
                )}

                {/* Display current location status */}
                {formData.locationMethod === 'current' && formData.location.lat !== 0 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-500 rounded-full">
                        <Navigation className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-green-800 font-semibold">Position actuelle utilisée</h4>
                        <p className="text-sm text-green-700">
                          GPS: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                        </p>
                        <p className="text-xs text-green-600 mt-1">Position obtenue automatiquement</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Satellite Map Section */}
                {formData.locationMethod === 'map' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      {/* Map Controls Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-blue-800 font-semibold flex items-center">
                            <Map className="h-5 w-5 mr-2" />
                            Carte Satellite Interactive - Tunisie
                          </h4>
                          <p className="text-sm text-blue-700 mt-1">
                            {mapZoom <= 2 ? "Cliquez sur une ville pour zoomer" : "Cliquez à l'endroit exact de votre bien"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowSatellite(!showSatellite)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                              showSatellite ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {showSatellite ? "🛰️ Satellite" : "🗺️ Plan"}
                          </button>
                        </div>
                      </div>

                      {/* Zoom Controls */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={zoomOut}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded flex items-center space-x-1 transition-colors"
                            disabled={mapZoom <= 0.5}
                          >
                            <span className="text-lg font-bold">−</span>
                            <span className="text-xs">Zoom -</span>
                          </button>
                          
                          <div className="bg-white border px-3 py-2 rounded text-sm font-medium min-w-[80px] text-center">
                            Zoom {mapZoom.toFixed(1)}x
                          </div>
                          
                          <button
                            type="button"
                            onClick={zoomIn}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded flex items-center space-x-1 transition-colors"
                            disabled={mapZoom >= 8}
                          >
                            <span className="text-lg font-bold">+</span>
                            <span className="text-xs">Zoom +</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={resetView}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors"
                          >
                            🌍 Vue globale
                          </button>
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          Centre: {mapCenter.lat.toFixed(3)}, {mapCenter.lng.toFixed(3)}
                        </div>
                      </div>
                      
                      {/* Interactive Satellite Map */}
                      <div 
                        className={`relative rounded-lg min-h-[500px] border-2 border-blue-200 cursor-crosshair overflow-hidden ${
                          showSatellite 
                            ? "bg-gradient-to-br from-green-900 via-yellow-800 to-blue-900" 
                            : "bg-gradient-to-br from-blue-100 to-green-100"
                        }`}
                        onClick={handleMapClick}
                        style={{
                          backgroundImage: showSatellite 
                            ? "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><defs><pattern id=%22satellite%22 width=%2220%22 height=%2220%22 patternUnits=%22userSpaceOnUse%22><rect width=%2220%22 height=%2220%22 fill=%22%23134e4a%22/><circle cx=%2210%22 cy=%2210%22 r=%221%22 fill=%22%23065f46%22/></pattern></defs><rect width=%22100%25%22 height=%22100%25%22 fill=%22url(%23satellite)%22/></svg>')"
                            : "none",
                          backgroundSize: showSatellite ? `${20 / mapZoom}px ${20 / mapZoom}px` : "none"
                        }}
                      >
                        {/* Map Info */}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded px-3 py-2 text-sm font-semibold text-gray-800 shadow-md">
                          🇹🇳 Tunisie - {showSatellite ? "Vue Satellite" : "Vue Plan"}
                        </div>
                        
                        {/* Crosshair for precision */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                          <div className="w-6 h-6 border-2 border-red-500 rounded-full bg-red-500/20">
                            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                          </div>
                        </div>
                        
                        {/* Cities display based on zoom level */}
                        {tunisianCities
                          .filter(city => {
                            if (mapZoom >= 2) {
                              // Only show cities near current center when zoomed in
                              const distance = Math.sqrt(
                                Math.pow(city.lat - mapCenter.lat, 2) + Math.pow(city.lng - mapCenter.lng, 2)
                              );
                              return distance <= 2; // Within 2 degrees
                            }
                            return true; // Show all cities when zoomed out
                          })
                          .map((city) => {
                            // Calculate position relative to current view
                            const viewWidth = 5 / mapZoom;
                            const viewHeight = 8 / mapZoom;
                            
                            const relativeX = ((city.lng - (mapCenter.lng - viewWidth / 2)) / viewWidth) * 100;
                            const relativeY = (((mapCenter.lat + viewHeight / 2) - city.lat) / viewHeight) * 100;
                            
                            // Only show if within current view
                            if (relativeX < 0 || relativeX > 100 || relativeY < 0 || relativeY > 100) {
                              return null;
                            }
                            
                            const isNearSelected = formData.location.lat !== 0 && 
                              Math.abs(formData.location.lat - city.lat) < 0.5 && 
                              Math.abs(formData.location.lng - city.lng) < 0.5;
                            
                            return (
                              <button
                                key={city.name}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMapCityClick(city);
                                }}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 group ${
                                  isNearSelected
                                    ? "bg-red-500 text-white scale-125 shadow-lg" 
                                    : "bg-blue-500 hover:bg-blue-600 text-white hover:scale-110"
                                } rounded-full ${mapZoom >= 2 ? 'w-4 h-4' : 'w-3 h-3'}`}
                                style={{ left: `${relativeX}%`, top: `${relativeY}%` }}
                                title={`${city.name} - Cliquez pour zoomer`}
                              >
                                <span className={`absolute ${mapZoom >= 2 ? '-top-10' : '-top-8'} left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg`}>
                                  {city.name} - {city.region}
                                </span>
                              </button>
                            );
                          })
                        }
                        
                        {/* Selected position marker */}
                        {formData.location.lat !== 0 && (
                          (() => {
                            const viewWidth = 5 / mapZoom;
                            const viewHeight = 8 / mapZoom;
                            const relativeX = ((formData.location.lng - (mapCenter.lng - viewWidth / 2)) / viewWidth) * 100;
                            const relativeY = (((mapCenter.lat + viewHeight / 2) - formData.location.lat) / viewHeight) * 100;
                            
                            if (relativeX >= 0 && relativeX <= 100 && relativeY >= 0 && relativeY <= 100) {
                              return (
                                <div
                                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                  style={{ left: `${relativeX}%`, top: `${relativeY}%` }}
                                >
                                  <div className="w-8 h-8 bg-green-500 border-4 border-white rounded-full shadow-lg animate-pulse">
                                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-semibold">
                                      🏠 Votre bien
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()
                        )}
                        
                        {/* Instructions overlay */}
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-2 rounded max-w-xs">
                          {mapZoom <= 2 
                            ? "👆 Cliquez sur une ville pour zoomer"
                            : "🎯 Cliquez à l'endroit exact de votre propriété"
                          }
                        </div>
                      </div>
                    </div>

                    {formData.location.lat !== 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-green-500 rounded-full">
                            <MapPin className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-green-800 font-semibold">Position sélectionnée sur la carte</h4>
                            <p className="text-sm text-green-700">{formData.address}</p>
                            <p className="text-xs text-green-600 mt-1">
                              Coordonnées: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.locationMethod === 'text' && formData.address && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-orange-500 rounded-full">
                        <Type className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-orange-800 font-semibold">Adresse saisie manuellement</h4>
                        <p className="text-sm text-orange-700">{formData.address}</p>
                        <p className="text-xs text-orange-600 mt-1">
                          {validateManualAddress(formData.address).valid ? 
                            "✓ Adresse validée" : 
                            validateManualAddress(formData.address).message
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!formData.locationMethod && (
                  <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-dashed border-primary/30 rounded-lg text-center">
                    <MapPin className="h-12 w-12 mx-auto text-primary/60 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Localisation requise</h3>
                    <p className="text-gray-600 mb-2">Choisissez votre méthode de localisation préférée</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>📍 <strong>Position actuelle</strong> : GPS automatique</p>
                      <p>🗺️ <strong>Sur la carte</strong> : Pointer directement sur la carte</p>
                      <p>✏️ <strong>Saisie manuelle</strong> : Écrire l'adresse</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Furnished Section */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Ameublement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="furnished"
                    checked={formData.furnished}
                    onCheckedChange={(checked) => handleInputChange('furnished', checked)}
                  />
                  <Label htmlFor="furnished" className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>Bien meublé</span>
                  </Label>
                </div>

                {formData.furnished && (
                  <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-800">Sélectionner les meubles (optionnel)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {furnitureItems.map((item) => {
                        const isSelected = formData.furniture.find(f => f.item === item.id);
                        return (
                          <div key={item.id} className="space-y-2">
                            <button
                              type="button"
                              onClick={() => isSelected ? removeFurniture(item.id) : addFurniture(item.id)}
                              className={`w-full p-2 border rounded-lg text-sm flex items-center space-x-2 transition-colors ${
                                isSelected ? "border-orange-500 bg-orange-100" : "border-gray-200 hover:border-orange-300"
                              }`}
                            >
                              {item.icon}
                              <span>{item.label}</span>
                              {isSelected && <Heart className="h-3 w-3 text-orange-600 ml-auto" />}
                            </button>
                            {isSelected && (
                              <Select
                                value={isSelected.condition}
                                onValueChange={(value) => updateFurnitureCondition(item.id, value as any)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="excellent">🌟 Excellent</SelectItem>
                                  <SelectItem value="bon">👍 Bon état</SelectItem>
                                  <SelectItem value="acceptable">⚠️ Acceptable</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Équipements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableAmenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={formData.amenities.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      <Label htmlFor={amenity.id} className="flex items-center space-x-2 cursor-pointer">
                        {amenity.icon}
                        <span className="text-sm">{amenity.label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rules */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Règles du logement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Ajouter une règle..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                  />
                  <Button type="button" onClick={addRule}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.rules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between p-2 glass-card rounded">
                      <span className="text-sm">{rule}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeRule(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Images and Videos */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Photos & Vidéos</CardTitle>
                <p className="text-sm text-muted-foreground">Ajoutez jusqu'à 10 photos/vidéos pour mettre en valeur votre bien</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary transition-colors">
                  <div className="text-center space-y-4">
                    <Upload className="h-10 w-10 mx-auto text-gray-400" />
                    <div>
                      <Label htmlFor="images" className="text-base font-medium cursor-pointer hover:text-primary">
                        Cliquez pour ajouter des fichiers
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        PNG, JPG, MP4 jusqu'à 50MB chacun
                      </p>
                    </div>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Fichiers ajoutés ({formData.images.length}/10)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex flex-col items-center justify-center p-4 border">
                            {file.type.startsWith('image/') ? (
                              <span className="text-2xl">🖼️</span>
                            ) : (
                              <span className="text-2xl">🎥</span>
                            )}
                            <span className="text-xs text-center mt-2 font-medium truncate w-full">
                              {file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <Card className="glass-card border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">💰</span>
                  <span>Tarification</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-base font-medium">Prix principal *</Label>
                    <div className="relative">
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="450"
                        required
                        className="text-lg font-semibold pr-12"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">TND</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceType" className="text-base font-medium">Période</Label>
                    <Select value={formData.priceType} onValueChange={(value) => handleInputChange('priceType', value)}>
                      <SelectTrigger className="text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jour">Par jour</SelectItem>
                        <SelectItem value="semaine">Par semaine</SelectItem>
                        <SelectItem value="mois">Par mois</SelectItem>
                        <SelectItem value="année">Par année</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit" className="text-base font-medium flex items-center space-x-2">
                    <span>🛡️</span>
                    <span>Caution (TND)</span>
                  </Label>
                  <Input
                    id="deposit"
                    type="number"
                    value={formData.pricing.deposit}
                    onChange={(e) => handleInputChange('pricing.deposit', e.target.value)}
                    placeholder="200-400"
                    className="text-lg"
                  />
                  <p className="text-xs text-muted-foreground">Montant remboursé en fin de location</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="utilitiesIncluded"
                      checked={formData.pricing.utilitiesIncluded}
                      onCheckedChange={(checked) => handleInputChange('pricing.utilitiesIncluded', checked)}
                    />
                    <Label htmlFor="utilitiesIncluded" className="text-base font-medium flex items-center space-x-2">
                      <span>⚡</span>
                      <span>Charges incluses dans le prix</span>
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="utilities" className="text-sm font-medium">Détails des charges</Label>
                    <Input
                      id="utilities"
                      value={formData.pricing.utilities}
                      onChange={(e) => handleInputChange('pricing.utilities', e.target.value)}
                      placeholder="Ex: Électricité incluse jusqu'à 100 TND/mois, eau comprise..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Availability */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Disponibilité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="availableFrom">Disponible à partir du</Label>
                  <Input
                    id="availableFrom"
                    type="date"
                    value={formData.availability.availableFrom}
                    onChange={(e) => handleInputChange('availability.availableFrom', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="minimumStay">Séjour minimum</Label>
                  <Select value={formData.availability.minimumStay} onValueChange={(value) => handleInputChange('availability.minimumStay', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 semaine">1 semaine</SelectItem>
                      <SelectItem value="1 mois">1 mois</SelectItem>
                      <SelectItem value="3 mois">3 mois</SelectItem>
                      <SelectItem value="6 mois">6 mois</SelectItem>
                      <SelectItem value="1 an">1 an</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maximumStay">Séjour maximum</Label>
                  <Select value={formData.availability.maximumStay} onValueChange={(value) => handleInputChange('availability.maximumStay', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3 mois">3 mois</SelectItem>
                      <SelectItem value="6 mois">6 mois</SelectItem>
                      <SelectItem value="1 an">1 an</SelectItem>
                      <SelectItem value="2 ans">2 ans</SelectItem>
                      <SelectItem value="Illimité">Illimité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Card className="glass-card">
              <CardContent className="pt-6">
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Publier le bien
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Votre bien sera vérifié avant publication
                </p>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;