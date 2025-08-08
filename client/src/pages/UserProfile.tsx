import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit,
  ArrowLeft,
  Star,
  CheckCircle,
  Upload,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }

    const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    setUserProfile(profile);
    setEditData(profile);
  }, [navigate]);

  const getUserBadges = () => {
    const badges = [];
    if (userProfile?.email && userProfile?.phone && userProfile?.cinNumber) {
      badges.push({ label: "Compte vérifié", icon: "✅", color: "success" });
    }
    if (userProfile?.userType === "owner") {
      badges.push({ label: "Propriétaire actif", icon: "📷", color: "default" });
    }
    badges.push({ label: "Membre", icon: "🎖", color: "secondary" });
    return badges;
  };

  const handleSave = () => {
    localStorage.setItem("userProfile", JSON.stringify(editData));
    setUserProfile(editData);
    setIsEditing(false);
    
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été sauvegardées",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditData({ ...editData, profilePicture: file });
      toast({
        title: "Photo mise à jour",
        description: "Votre nouvelle photo de profil a été sélectionnée",
      });
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold gradient-text flex items-center space-x-3">
              <User className="h-8 w-8 text-primary" />
              <span>Mon Profil</span>
            </h1>
          </div>
          <Button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            variant={isEditing ? "default" : "outline"}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? "Sauvegarder" : "Modifier"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prénom</Label>
                    {isEditing ? (
                      <Input
                        value={editData.firstName || ""}
                        onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      />
                    ) : (
                      <p className="p-2 bg-muted rounded">{userProfile.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label>Nom</Label>
                    {isEditing ? (
                      <Input
                        value={editData.lastName || ""}
                        onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      />
                    ) : (
                      <p className="p-2 bg-muted rounded">{userProfile.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      value={editData.email || ""}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      type="email"
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{userProfile.email}</span>
                    </p>
                  )}
                </div>

                <div>
                  <Label>Téléphone</Label>
                  {isEditing ? (
                    <Input
                      value={editData.phone || ""}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>{userProfile.phone}</span>
                    </p>
                  )}
                </div>

                {userProfile.userType === "student" && userProfile.studentInfo && (
                  <div className="space-y-2">
                    <Label>Informations étudiant</Label>
                    <div className="p-3 glass-card rounded-lg space-y-2">
                      <p><strong>Université:</strong> {userProfile.studentInfo.university}</p>
                      <p><strong>Numéro étudiant:</strong> {userProfile.studentInfo.studentId}</p>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div>
                    <Label>Photo de profil</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Vérification d'identité</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className={`p-4 rounded-lg ${userProfile.email ? 'bg-success/10' : 'bg-muted'}`}>
                      <Mail className={`h-6 w-6 mx-auto mb-2 ${userProfile.email ? 'text-success' : 'text-muted-foreground'}`} />
                      <p className="text-sm">Email</p>
                      {userProfile.email ? (
                        <CheckCircle className="h-4 w-4 text-success mx-auto mt-1" />
                      ) : (
                        <Button size="sm" variant="outline" className="mt-1">Vérifier</Button>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`p-4 rounded-lg ${userProfile.phone ? 'bg-success/10' : 'bg-muted'}`}>
                      <Phone className={`h-6 w-6 mx-auto mb-2 ${userProfile.phone ? 'text-success' : 'text-muted-foreground'}`} />
                      <p className="text-sm">Téléphone</p>
                      {userProfile.phone ? (
                        <CheckCircle className="h-4 w-4 text-success mx-auto mt-1" />
                      ) : (
                        <Button size="sm" variant="outline" className="mt-1">Vérifier</Button>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`p-4 rounded-lg ${userProfile.cinNumber ? 'bg-success/10' : 'bg-muted'}`}>
                      <User className={`h-6 w-6 mx-auto mb-2 ${userProfile.cinNumber ? 'text-success' : 'text-muted-foreground'}`} />
                      <p className="text-sm">CIN/Passeport</p>
                      {userProfile.cinNumber ? (
                        <CheckCircle className="h-4 w-4 text-success mx-auto mt-1" />
                      ) : (
                        <Button size="sm" variant="outline" className="mt-1">Vérifier</Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-primary" />
                </div>
                <h3 className="font-semibold">{userProfile.firstName} {userProfile.lastName}</h3>
                <p className="text-muted-foreground capitalize">{userProfile.userType}</p>
                <Badge variant="outline" className="mt-2">
                  Membre depuis {new Date().getFullYear()}
                </Badge>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Badges</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {getUserBadges().map((badge, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 glass-card rounded">
                    <span>{badge.icon}</span>
                    <span className="text-sm">{badge.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Stats */}
            {userProfile.userType === "owner" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Biens publiés</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Contrats signés</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;