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
      setFormData({ ...formData, profilePicture: file });
    }
  };

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

            <div className="space-y-2">
              <Label htmlFor="profilePicture">Photo de profil (facultative)</Label>
              <Input
                id="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
              />
              {formData.profilePicture && (
                <p className="text-sm text-success">✓ Photo sélectionnée: {formData.profilePicture.name}</p>
              )}
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
    </div>
  );
};

export default Signup;