import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, GraduationCap, Users, Building, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    userType: "",
    cinNumber: "",
    profilePicture: null as File | null,
    gender: "" as "male" | "female" | "",
    avatarUrl: "",
    acceptTerms: false,
    studentInfo: {
      university: "",
      studentId: ""
    },
    socialAccounts: {
      facebook: "",
      instagram: "",
      linkedin: ""
    }
  });
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedGender, setSelectedGender] = useState<"male" | "female" | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const universities = [
    "Université de Tunis El Manar",
    "Université de Sfax", 
    "INSAT",
    "ENSI",
    "IHEC",
    "ESC Tunis",
    "Autre"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Erreur",
        description: "Vous devez accepter les conditions générales d'utilisation.",
        variant: "destructive",
      });
      return;
    }

    // Mock registration
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userEmail", formData.email);
    localStorage.setItem("userType", formData.userType);
    localStorage.setItem("userProfile", JSON.stringify(formData));
    
    // Special message for owners
    if (formData.userType === "owner") {
      toast({
        title: "Compte créé - En attente de validation",
        description: "Votre compte propriétaire est en attente de validation par un administrateur. L'activation définitive se fera après paiement.",
      });
    } else {
      toast({
        title: "Inscription réussie!",
        description: "Votre compte a été créé avec succès.",
      });
    }
    
    navigate("/dashboard");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, profilePicture: file, avatarUrl: "" });
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setFormData({ ...formData, avatarUrl, profilePicture: null });
    setShowAvatarModal(false);
  };

  // Fetch avatars
  const { data: avatarsData } = useQuery({
    queryKey: ["/api/avatars", selectedGender],
    queryFn: async () => {
      const response = await fetch(`/api/avatars?gender=${selectedGender}`);
      if (!response.ok) throw new Error("Failed to fetch avatars");
      return response.json();
    },
    enabled: showAvatarModal && !!selectedGender
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="gradient-primary p-2 rounded-xl">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Ekrili</h1>
          </div>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez la communauté Ekrili
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Type d'utilisateur */}
            <div className="space-y-3">
              <Label>Je suis...</Label>
              <RadioGroup
                value={formData.userType}
                onValueChange={(value) => setFormData({ ...formData, userType: value })}
                className="grid grid-cols-3 gap-4"
              >
                <div className="flex items-center space-x-2 glass-card p-4 rounded-lg">
                  <RadioGroupItem value="tenant" id="tenant" />
                  <Label htmlFor="tenant" className="flex items-center space-x-2 cursor-pointer">
                    <Users className="h-4 w-4" />
                    <span>Locataire</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 glass-card p-4 rounded-lg">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="flex items-center space-x-2 cursor-pointer">
                    <GraduationCap className="h-4 w-4" />
                    <span>Étudiant</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 glass-card p-4 rounded-lg">
                  <RadioGroupItem value="owner" id="owner" />
                  <Label htmlFor="owner" className="flex items-center space-x-2 cursor-pointer">
                    <Building className="h-4 w-4" />
                    <span>Propriétaire</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Photo et Avatar */}
            <div className="space-y-3">
              <Label>Photo de profil (optionnel)</Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner votre genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Homme</SelectItem>
                        <SelectItem value="female">Femme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedGender("male");
                      setShowAvatarModal(true);
                    }}
                    disabled={!formData.gender}
                  >
                    👨 Avatar H
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedGender("female");
                      setShowAvatarModal(true);
                    }}
                    disabled={!formData.gender}
                  >
                    👩 Avatar F
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('profile-picture')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {(formData.profilePicture || formData.avatarUrl) && (
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar sélectionné" className="w-full h-full object-cover" />
                    ) : formData.profilePicture ? (
                      <img src={URL.createObjectURL(formData.profilePicture)} alt="Photo téléchargée" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                </div>
              )}
              
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Informations personnelles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+216 XX XXX XXX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cinNumber">3 derniers chiffres de la CIN/Passeport *</Label>
              <Input
                id="cinNumber"
                value={formData.cinNumber}
                onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value })}
                placeholder="123"
                maxLength={3}
                required
              />
            </div>


            {/* Social Accounts */}
            <div className="space-y-4 p-4 glass-card rounded-lg">
              <h3 className="font-semibold">Comptes sociaux (facultatif)</h3>
              <div className="grid grid-cols-1 gap-2">
                <Input
                  placeholder="Profil Facebook"
                  value={formData.socialAccounts.facebook}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    socialAccounts: { ...formData.socialAccounts, facebook: e.target.value }
                  })}
                />
                <Input
                  placeholder="Profil Instagram"
                  value={formData.socialAccounts.instagram}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    socialAccounts: { ...formData.socialAccounts, instagram: e.target.value }
                  })}
                />
                <Input
                  placeholder="Profil LinkedIn"
                  value={formData.socialAccounts.linkedin}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    socialAccounts: { ...formData.socialAccounts, linkedin: e.target.value }
                  })}
                />
              </div>
            </div>

            {/* Informations étudiant */}
            {formData.userType === "student" && (
              <div className="space-y-4 p-4 glass-card rounded-lg">
                <h3 className="font-semibold flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Informations étudiant</span>
                </h3>
                <div className="space-y-2">
                  <Label>Université</Label>
                  <Select
                    value={formData.studentInfo.university}
                    onValueChange={(value) => 
                      setFormData({ 
                        ...formData, 
                        studentInfo: { ...formData.studentInfo, university: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre université" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Numéro étudiant</Label>
                  <Input
                    id="studentId"
                    value={formData.studentInfo.studentId}
                    onChange={(e) => 
                      setFormData({ 
                        ...formData, 
                        studentInfo: { ...formData.studentInfo, studentId: e.target.value }
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Mots de passe */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>
            {/* Terms and Conditions */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
              />
              <Label htmlFor="acceptTerms" className="text-sm cursor-pointer">
                J'accepte les{" "}
                <a href="/terms" className="text-primary hover:underline">conditions générales d'utilisation</a>
                {" "}et la{" "}
                <a href="/privacy" className="text-primary hover:underline">politique de confidentialité</a>
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!formData.userType || !formData.acceptTerms}
            >
              Créer mon compte
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Déjà un compte?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAvatarModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                Choisir un avatar {selectedGender === 'male' ? 'masculin' : 'féminin'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAvatarModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {avatarsData?.avatars?.map((avatarUrl: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAvatarSelect(avatarUrl)}
                  className="relative group rounded-full overflow-hidden hover:ring-4 hover:ring-primary/20 transition-all"
                >
                  <img
                    src={avatarUrl}
                    alt={`Avatar ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-full"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-full" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;