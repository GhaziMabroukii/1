import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import { UserBadges } from "@/components/BadgeSystem";
import { VerificationModal } from "@/components/VerificationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  Shield,
  Camera,
  Award,
  TrendingUp,
  Clock,
  FileText,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [verificationModal, setVerificationModal] = useState<{
    isOpen: boolean;
    type: "email" | "phone" | "document" | null;
  }>({ isOpen: false, type: null });
  
  const [avatarModal, setAvatarModal] = useState<{
    isOpen: boolean;
    gender: "male" | "female" | null;
  }>({ isOpen: false, gender: null });
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user ID
  const currentUserId = Number(localStorage.getItem("userId"));

  // Fetch user profile
  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["/api/user/profile", currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${currentUserId}`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    enabled: !!currentUserId
  });

  // Fetch avatars
  const { data: avatarsData, isLoading: avatarsLoading, error: avatarsError } = useQuery({
    queryKey: ["/api/avatars", avatarModal.gender],
    queryFn: async () => {
      console.log("Fetching avatars for gender:", avatarModal.gender);
      const response = await fetch(`/api/avatars?gender=${avatarModal.gender}`);
      if (!response.ok) throw new Error("Failed to fetch avatars");
      const data = await response.json();
      console.log("Avatars data received:", data);
      return data;
    },
    enabled: avatarModal.isOpen && !!avatarModal.gender,
    staleTime: 0, // Always refetch to ensure fresh data
    gcTime: 5 * 60 * 1000 // Cache for 5 minutes
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/users/${currentUserId}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile", currentUserId] });
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées"
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    }
  });

  // Profile photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("userId", currentUserId.toString());
      
      // Use native fetch for FormData to avoid JSON parsing issues
      const response = await fetch("/api/upload/profile-photo", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile", currentUserId] });
      toast({
        title: "Photo mise à jour",
        description: "Votre photo de profil a été mise à jour avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de télécharger la photo",
        variant: "destructive"
      });
    }
  });

  // Set avatar mutation
  const setAvatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      return await apiRequest("/api/set-avatar", {
        method: "POST",
        body: JSON.stringify({ userId: currentUserId, avatarUrl })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile", currentUserId] });
      toast({
        title: "Avatar mis à jour",
        description: "Votre avatar a été mis à jour avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'avatar",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }

    if (userProfile) {
      setEditData(userProfile);
    }
  }, [navigate, userProfile]);

  const getVerificationScore = () => {
    let score = 0;
    if (userProfile?.emailVerified) score += 25;
    if (userProfile?.phoneVerified) score += 25;
    if (userProfile?.documentVerified) score += 50;
    return score;
  };

  const openVerificationModal = (type: "email" | "phone" | "document") => {
    setVerificationModal({ isOpen: true, type });
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximum autorisée est de 5MB",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format non supporté",
          description: "Seules les images sont autorisées",
          variant: "destructive"
        });
        return;
      }

      uploadPhotoMutation.mutate(file);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setAvatarMutation.mutate(avatarUrl);
    setAvatarModal({ isOpen: false, gender: null });
  };

  const openAvatarModal = (gender: "male" | "female") => {
    console.log("Opening avatar modal for gender:", gender);
    setAvatarModal({ isOpen: true, gender });
  };

  if (isLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
              </div>
            </div>
          </div>
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
            disabled={updateProfileMutation.isPending}
          >
            <Edit className="h-4 w-4 mr-2" />
            {updateProfileMutation.isPending ? "Sauvegarde..." : isEditing ? "Sauvegarder" : "Modifier"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verification Score Card */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Score de vérification</span>
                  </div>
                  <Badge variant={getVerificationScore() === 100 ? "default" : "secondary"}>
                    {getVerificationScore()}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={getVerificationScore()} className="mb-4" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Email vérifié: {userProfile.emailVerified ? "✅" : "❌"} (+25%)</p>
                  <p>• Téléphone vérifié: {userProfile.phoneVerified ? "✅" : "❌"} (+25%)</p>
                  <p>• Document d'identité: {userProfile.documentVerified ? "✅" : "❌"} (+50%)</p>
                </div>
                {getVerificationScore() === 100 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Profil 100% vérifié ! Vos annonces seront mieux classées.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

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
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <Input
                        value={editData.email || ""}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        type="email"
                        className="flex-1"
                      />
                    ) : (
                      <div className="flex-1 p-2 bg-muted rounded flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{userProfile.email}</span>
                        {userProfile.emailVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    )}
                    {!userProfile.emailVerified && userProfile.email && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openVerificationModal("email")}
                      >
                        Vérifier
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Téléphone</Label>
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <Input
                        value={editData.phone || ""}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                        className="flex-1"
                      />
                    ) : (
                      <div className="flex-1 p-2 bg-muted rounded flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{userProfile.phone}</span>
                        {userProfile.phoneVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    )}
                    {!userProfile.phoneVerified && userProfile.phone && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openVerificationModal("phone")}
                      >
                        Vérifier
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Genre</Label>
                    {isEditing ? (
                      <select 
                        value={editData.gender || ""} 
                        onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                      </select>
                    ) : (
                      <p className="p-2 bg-muted rounded">
                        {userProfile.gender === 'male' ? 'Homme' : userProfile.gender === 'female' ? 'Femme' : 'Non spécifié'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Date de naissance</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editData.dateOfBirth || ""}
                        onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                      />
                    ) : (
                      <p className="p-2 bg-muted rounded">
                        {userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth).toLocaleDateString() : 'Non spécifiée'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Adresse</Label>
                  {isEditing ? (
                    <Input
                      value={editData.address || ""}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      placeholder="Votre adresse complète"
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{userProfile.address || 'Non spécifiée'}</span>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div>
                    <Label>Biographie (optionnel)</Label>
                    <Textarea
                      value={editData.bio || ""}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      placeholder="Parlez-nous de vous..."
                      rows={3}
                    />
                  </div>
                )}
                
                {!isEditing && userProfile.bio && (
                  <div>
                    <Label>Biographie</Label>
                    <p className="p-2 bg-muted rounded italic">"{userProfile.bio}"</p>
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
                    <div className={`p-4 rounded-lg border-2 transition-colors ${userProfile.emailVerified ? 'bg-green-50 border-green-200' : 'bg-muted border-border'}`}>
                      <Mail className={`h-6 w-6 mx-auto mb-2 ${userProfile.emailVerified ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium">Email</p>
                      {userProfile.emailVerified ? (
                        <div className="mt-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                          <p className="text-xs text-green-600 mt-1">Vérifié</p>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => openVerificationModal("email")}
                          disabled={!userProfile.email}
                        >
                          Vérifier
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`p-4 rounded-lg border-2 transition-colors ${userProfile.phoneVerified ? 'bg-green-50 border-green-200' : 'bg-muted border-border'}`}>
                      <Phone className={`h-6 w-6 mx-auto mb-2 ${userProfile.phoneVerified ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium">Téléphone</p>
                      {userProfile.phoneVerified ? (
                        <div className="mt-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                          <p className="text-xs text-green-600 mt-1">Vérifié</p>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => openVerificationModal("phone")}
                          disabled={!userProfile.phone}
                        >
                          Vérifier
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`p-4 rounded-lg border-2 transition-colors ${userProfile.documentVerified ? 'bg-green-50 border-green-200' : 'bg-muted border-border'}`}>
                      <FileText className={`h-6 w-6 mx-auto mb-2 ${userProfile.documentVerified ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium">CIN/Passeport</p>
                      {userProfile.documentVerified ? (
                        <div className="mt-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                          <p className="text-xs text-green-600 mt-1">Vérifié</p>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => openVerificationModal("document")}
                        >
                          Scanner
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {userProfile.documentVerified && userProfile.documentType && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-800">
                        Document vérifié: {userProfile.documentType === "cin" ? "Carte d'identité" : "Passeport"}
                        {userProfile.documentVerifiedAt && (
                          <span className="ml-2 text-xs">
                            (vérifié le {new Date(userProfile.documentVerifiedAt).toLocaleDateString()})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="relative group">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={userProfile.profilePicture} />
                    <AvatarFallback className="text-2xl">
                      {userProfile.firstName?.[0]}{userProfile.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          disabled={uploadPhotoMutation.isPending || setAvatarMutation.isPending}
                          title="Télécharger une photo personnelle"
                          className="bg-white/90 hover:bg-white text-gray-700"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openAvatarModal("male")}
                          disabled={uploadPhotoMutation.isPending || setAvatarMutation.isPending}
                          title="Choisir un avatar masculin"
                          className="bg-blue-500/90 hover:bg-blue-500 text-white border-blue-600"
                        >
                          👨
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openAvatarModal("female")}
                          disabled={uploadPhotoMutation.isPending || setAvatarMutation.isPending}
                          title="Choisir un avatar féminin"
                          className="bg-pink-500/90 hover:bg-pink-500 text-white border-pink-600"
                        >
                          👩
                        </Button>
                      </div>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Survolez pour changer votre photo
                      </p>
                      <div className="flex justify-center space-x-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAvatarModal("male")}
                          disabled={uploadPhotoMutation.isPending || setAvatarMutation.isPending}
                          className="text-xs"
                        >
                          👨 Avatars masculins
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAvatarModal("female")}
                          disabled={uploadPhotoMutation.isPending || setAvatarMutation.isPending}
                          className="text-xs"
                        >
                          👩 Avatars féminins
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold">{userProfile.firstName} {userProfile.lastName}</h3>
                <p className="text-muted-foreground capitalize">{userProfile.userType}</p>
                <Badge variant="outline" className="mt-2">
                  Membre depuis {new Date(userProfile.createdAt).getFullYear()}
                </Badge>
                
                {userProfile.bio && (
                  <p className="text-sm text-muted-foreground mt-3 italic">
                    "{userProfile.bio}"
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Badges */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Badges & Vérifications</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <UserBadges
                  userType={userProfile.userType}
                  isVerified={userProfile.isVerified}
                  contractsCount={userProfile.contractsCount}
                  rating={parseFloat(userProfile.rating || "0")}
                  responseTime={userProfile.responseTime}
                  memberSince={userProfile.createdAt}
                />
              </CardContent>
            </Card>

            {/* Stats */}
            {userProfile.userType === "owner" && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-2xl font-bold">{userProfile.contractsCount || 0}</p>
                      <p className="text-sm text-muted-foreground">Contrats signés</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-2xl font-bold">{userProfile.rating || "0"}</p>
                      <p className="text-sm text-muted-foreground">Note moyenne</p>
                    </div>
                  </div>
                  
                  {userProfile.responseTime && (
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Temps de réponse: 
                          <span className={`ml-1 font-medium ${
                            userProfile.responseTime === "fast" ? "text-green-600" :
                            userProfile.responseTime === "normal" ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {userProfile.responseTime === "fast" ? "Rapide" :
                             userProfile.responseTime === "normal" ? "Normal" : "Lent"}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={verificationModal.isOpen}
        onClose={() => setVerificationModal({ isOpen: false, type: null })}
        verificationType={verificationModal.type}
        userProfile={userProfile}
      />

      {/* Avatar Selection Modal */}
      {avatarModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setAvatarModal({ isOpen: false, gender: null })}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                Choisir un avatar {avatarModal.gender === 'male' ? 'masculin' : 'féminin'}
              </h3>
              <div className="text-xs text-gray-500">
                Modal: {avatarModal.isOpen ? 'Open' : 'Closed'} | 
                Gender: {avatarModal.gender} | 
                Loading: {avatarsLoading ? 'Yes' : 'No'} | 
                Data: {avatarsData ? 'Yes' : 'No'} |
                Count: {avatarsData?.avatars?.length || 0}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAvatarModal({ isOpen: false, gender: null })}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </Button>
            </div>
            
            {avatarsError ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-red-600">Erreur lors du chargement des avatars</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => {
                      setAvatarModal({ isOpen: false, gender: null });
                      setTimeout(() => setAvatarModal({ isOpen: true, gender: avatarModal.gender }), 100);
                    }}
                  >
                    Réessayer
                  </Button>
                </div>
              </div>
            ) : avatarsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Chargement des avatars...</p>
                </div>
              </div>
            ) : avatarsData?.avatars && avatarsData.avatars.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {avatarsData.avatars.map((avatarUrl: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAvatarSelect(avatarUrl)}
                    className="relative group rounded-full overflow-hidden hover:ring-4 hover:ring-primary/30 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/50"
                    disabled={setAvatarMutation.isPending}
                    title={`Choisir cet avatar`}
                  >
                    <img
                      src={avatarUrl}
                      alt={`Avatar ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-full border-2 border-transparent group-hover:border-primary/30"
                      loading="lazy"
                      onError={(e) => {
                        console.error('Failed to load avatar:', avatarUrl);
                        // Hide broken images
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Avatar loaded successfully:', avatarUrl);
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-full flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-1">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun avatar disponible</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Données reçues: {JSON.stringify(avatarsData)}
                  </p>
                </div>
              </div>
            )}
            
            {setAvatarMutation.isPending && (
              <div className="flex items-center justify-center mt-6 p-4 bg-primary/10 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-3 text-sm font-medium">Mise à jour de votre avatar...</span>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Cliquez sur un avatar pour l'utiliser comme photo de profil
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;