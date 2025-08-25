import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import RecentProperties from "@/components/RecentProperties";
import { LoadingSpinner, CardSkeleton } from "@/components/LoadingSpinner";
import { NetworkError } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home, 
  Heart, 
  MessageSquare, 
  Star, 
  Plus, 
  TrendingUp, 
  Users, 
  MapPin,
  Calendar,
  DollarSign
} from "lucide-react";

const Dashboard = () => {
  const [userType, setUserType] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check authentication
        const isAuth = localStorage.getItem("isAuthenticated");
        if (!isAuth) {
          navigate("/login");
          return;
        }

        // Simulate network delay for loading state demonstration
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const type = localStorage.getItem("userType") || "";
        const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
        
        setUserType(type);
        setUserProfile(profile);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || "Une erreur s'est produite lors du chargement du dashboard");
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const retryLoading = () => {
    setError(null);
    const type = localStorage.getItem("userType") || "";
    const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    setUserType(type);
    setUserProfile(profile);
    setLoading(false);
  };

  // Mock data
  const mockFavorites = [
    {
      id: 1,
      title: "Studio moderne près INSAT",
      price: "450 TND/mois",
      location: "Ariana, Raoued",
      rating: 4.8,
      image: "/placeholder.svg"
    },
    {
      id: 2,
      title: "Appartement 2 pièces",
      price: "650 TND/mois", 
      location: "Tunis, Bardo",
      rating: 4.6,
      image: "/placeholder.svg"
    }
  ];

  const mockProperties = [
    {
      id: 1,
      title: "Villa familiale avec jardin",
      price: "1200 TND/mois",
      status: "Occupé",
      views: 234,
      messages: 8
    },
    {
      id: 2,
      title: "Studio étudiant meublé",
      price: "480 TND/mois",
      status: "Disponible",
      views: 156,
      messages: 12
    }
  ];

  const mockStats = {
    totalProperties: 3,
    activeContracts: 2,
    monthlyRevenue: 1680,
    occupancyRate: 85
  };

  if (userType === "owner") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">Dashboard Propriétaire</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Bienvenue, {userProfile?.firstName} {userProfile?.lastName}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 w-full sm:w-auto">
              <Button onClick={() => navigate("/add-property")} className="flex items-center justify-center space-x-2 text-sm sm:text-base">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Ajouter un bien</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/manage-properties")} 
                className="flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Gérer mes biens</span>
                <span className="sm:hidden">Gérer</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Biens totaux</CardTitle>
                <Home className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">{mockStats.totalProperties}</div>
                <p className="text-xs text-muted-foreground">+1 ce mois</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Contrats actifs</CardTitle>
                <Users className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">{mockStats.activeContracts}</div>
                <p className="text-xs text-muted-foreground">Stable</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Revenus mensuels</CardTitle>
                <DollarSign className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-lg sm:text-2xl font-bold">{mockStats.monthlyRevenue} TND</div>
                <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Taux d'occupation</CardTitle>
                <TrendingUp className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">{mockStats.occupancyRate}%</div>
                <p className="text-xs text-muted-foreground">Excellent</p>
              </CardContent>
            </Card>
          </div>

          {/* Properties */}
          <Card className="glass-card mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Mes biens</CardTitle>
              <CardDescription className="text-sm">Gérez vos propriétés</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-4">
                {mockProperties.map((property) => (
                  <div key={property.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-white/10 rounded-lg space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm sm:text-base">{property.title}</h3>
                      <p className="text-sm text-muted-foreground">{property.price}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <Badge variant={property.status === "Disponible" ? "default" : "secondary"} className="self-start sm:self-center">
                        {property.status}
                      </Badge>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {property.views} vues • {property.messages} messages
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate("/manage-properties")}
                        className="self-start sm:self-center text-sm"
                      >
                        Gérer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tenant/Student Dashboard
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
              Dashboard {userType === "student" ? "Étudiant" : "Locataire"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Bienvenue, {userProfile?.firstName} {userProfile?.lastName}
            </p>
            {userType === "student" && userProfile?.studentInfo?.university && (
              <p className="text-sm text-primary mt-1">
                📚 {userProfile.studentInfo.university}
              </p>
            )}
          </div>
          <Button onClick={() => navigate("/search")} className="flex items-center justify-center space-x-2 text-sm sm:text-base w-full sm:w-auto">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Rechercher un bien</span>
            <span className="sm:hidden">Rechercher</span>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="glass-card cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/search")}>
            <CardContent className="flex flex-col items-center p-4 sm:p-6">
              <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2" />
              <p className="text-xs sm:text-sm font-medium text-center">Rechercher</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/favorites")}>
            <CardContent className="flex flex-col items-center p-4 sm:p-6">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-destructive mb-2" />
              <p className="text-xs sm:text-sm font-medium text-center">Favoris</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/messages")}>
            <CardContent className="flex flex-col items-center p-4 sm:p-6">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-accent mb-2" />
              <p className="text-xs sm:text-sm font-medium text-center">Messages</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/contracts")}>
            <CardContent className="flex flex-col items-center p-4 sm:p-6">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-success mb-2" />
              <p className="text-xs sm:text-sm font-medium text-center">Contrats</p>
            </CardContent>
          </Card>
        </div>

        {/* Favorites */}
        <Card className="glass-card mb-6 sm:mb-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Heart className="h-5 w-5 text-destructive" />
              <span>Mes favoris</span>
            </CardTitle>
            <CardDescription className="text-sm">Biens sauvegardés</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockFavorites.map((property) => (
                <div key={property.id} className="glass-card p-3 sm:p-4 rounded-lg cursor-pointer hover:scale-105 transition-transform">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Home className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm truncate">{property.title}</h3>
                      <p className="text-primary font-medium text-sm">{property.price}</p>
                      <p className="text-xs text-muted-foreground flex items-center space-x-1 mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        <span className="text-xs">{property.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Activité récente</CardTitle>
            <CardDescription className="text-sm">Vos dernières actions</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Avatar className="mt-1 flex-shrink-0">
                  <AvatarFallback className="text-xs">AK</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">Ahmed Karim a répondu à votre message</p>
                  <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Avatar className="mt-1 flex-shrink-0">
                  <AvatarFallback className="text-xs">SF</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">Nouveau bien ajouté près de votre université</p>
                  <p className="text-xs text-muted-foreground">Il y a 1 jour</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;