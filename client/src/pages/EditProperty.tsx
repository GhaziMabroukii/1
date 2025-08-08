import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Home, 
  ArrowLeft, 
  Save,
  Wifi,
  Car,
  Plus,
  X,
  MapPin,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EditProperty = () => {
  const [match, params] = useRoute("/edit-property/:id");
  const id = params?.id;
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
    amenities: [] as string[],
    rules: [] as string[],
    images: [] as File[],
    status: "Disponible",
    pricing: {
      deposit: "",
      fees: "",
      utilities: "",
      utilitiesIncluded: false
    }
  });

  const [newRule, setNewRule] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Load property data (with mock data if needed)
    const properties = JSON.parse(localStorage.getItem("userProperties") || "[]");
    let property = properties.find((p: any) => p.id === parseInt(id || "0"));
    
    // If property doesn't exist, create mock data for testing
    if (!property) {
      property = {
        id: parseInt(id || "0"),
        title: "Studio moderne près INSAT",
        type: "studio",
        description: "Studio entièrement meublé et équipé, proche des transports en commun",
        price: "450",
        priceType: "mois",
        surface: "35",
        rooms: "1",
        bathrooms: "1",
        address: "Rue Ibn Khaldoun, Raoued 2088",
        location: { lat: 36.8065, lng: 10.1815 },
        amenities: ["wifi", "furnished", "parking"],
        rules: ["Non fumeur", "Pas d'animaux"],
        images: [],
        status: "Disponible",
        pricing: {
          deposit: "450",
          fees: "50",
          utilities: "",
          utilitiesIncluded: false
        }
      };
    }
    
    // Ensure all required fields are present with defaults
    const sanitizedProperty = {
      ...property,
      amenities: property.amenities || [],
      rules: property.rules || [],
      location: property.location || { lat: 0, lng: 0 },
      pricing: property.pricing || {
        deposit: "",
        fees: "",
        utilities: "",
        utilitiesIncluded: false
      }
    };
    
    setFormData(sanitizedProperty);
  }, [id]);

  const availableAmenities = [
    { id: "wifi", label: "Wi-Fi gratuit", icon: <Wifi className="h-4 w-4" /> },
    { id: "furnished", label: "Meublé", icon: <Home className="h-4 w-4" /> },
    { id: "parking", label: "Parking", icon: <Car className="h-4 w-4" /> },
    { id: "AC", label: "Climatisation", icon: <span>❄️</span> },
    { id: "washing_machine", label: "Lave-linge", icon: <span>🫧</span> },
    { id: "garden", label: "Jardin", icon: <span>🌿</span> },
    { id: "security", label: "Sécurité", icon: <span>🔒</span> },
    { id: "elevator", label: "Ascenseur", icon: <span>🛗</span> },
    { id: "balcony", label: "Balcon", icon: <span>🏠</span> },
    { id: "kitchen", label: "Cuisine équipée", icon: <span>🍳</span> }
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

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleInputChange('location', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: "Localisation mise à jour",
            description: "Position actuelle utilisée",
          });
        },
        () => {
          toast({
            title: "Erreur de géolocalisation",
            description: "Impossible d'obtenir votre position",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 10)
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    // Update property
    const properties = JSON.parse(localStorage.getItem("userProperties") || "[]");
    const updatedProperties = properties.map((p: any) => 
      p.id === parseInt(id || "0") ? { ...formData, updatedAt: new Date().toISOString() } : p
    );
    localStorage.setItem("userProperties", JSON.stringify(updatedProperties));

    toast({
      title: "Bien mis à jour!",
      description: "Les modifications ont été sauvegardées",
    });

    navigate("/manage-properties");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/manage-properties")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold gradient-text flex items-center space-x-3">
              <Home className="h-8 w-8 text-primary" />
              <span>Modifier le bien</span>
            </h1>
            <p className="text-muted-foreground">
              Modifiez les informations de votre propriété
            </p>
          </div>
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

                <div>
                  <Label htmlFor="address">Adresse complète *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Rue Ibn Khaldoun, Raoued 2088"
                    required
                  />
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleLocationClick}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Définir la position exacte
                </Button>
                
                {formData.location && formData.location.lat !== 0 && formData.location.lng !== undefined && (
                  <p className="text-sm text-success">
                    ✓ Position définie: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                  </p>
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

            {/* Images */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="images">Ajouter des photos</Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Statut du bien</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponible">Disponible</SelectItem>
                    <SelectItem value="Occupé">Occupé</SelectItem>
                    <SelectItem value="En rénovation">En rénovation</SelectItem>
                    <SelectItem value="En attente">En attente</SelectItem>
                    <SelectItem value="Indisponible">Indisponible</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            {/* Pricing */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Tarification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="price">Prix *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="450"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceType">Période</Label>
                    <Select value={formData.priceType} onValueChange={(value) => handleInputChange('priceType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="jour">Jour</SelectItem>
                        <SelectItem value="semaine">Semaine</SelectItem>
                        <SelectItem value="mois">Mois</SelectItem>
                        <SelectItem value="année">Année</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="deposit">Caution (TND)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    value={formData.pricing.deposit}
                    onChange={(e) => handleInputChange('pricing.deposit', e.target.value)}
                    placeholder="450"
                  />
                </div>

                <div>
                  <Label htmlFor="fees">Frais de dossier (TND)</Label>
                  <Input
                    id="fees"
                    type="number"
                    value={formData.pricing.fees}
                    onChange={(e) => handleInputChange('pricing.fees', e.target.value)}
                    placeholder="50"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="utilitiesIncluded"
                    checked={formData.pricing.utilitiesIncluded}
                    onCheckedChange={(checked) => handleInputChange('pricing.utilitiesIncluded', checked)}
                  />
                  <Label htmlFor="utilitiesIncluded">Charges incluses</Label>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button type="submit" className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder les modifications
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate("/manage-properties")}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;