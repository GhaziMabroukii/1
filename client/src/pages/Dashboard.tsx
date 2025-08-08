import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import RecentProperties from "@/components/RecentProperties";
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
  const [, navigate] = useLocation();

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      navigate("/login");
      return;
    }

    const type = localStorage.getItem("userType") || "";
    const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
    setUserType(type);
    setUserProfile(profile);
  }, [navigate]);

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
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold gradient-text">Dashboard Propriétaire</h1>
              <p className="text-muted-foreground">
                Bienvenue, {userProfile?.firstName} {userProfile?.lastName}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => navigate("/add-property")} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Ajouter un bien</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/manage-properties")} 
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Gérer mes biens</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Biens totaux</CardTitle>
                <Home className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalProperties}</div>
                <p className="text-xs text-muted-foreground">+1 ce mois</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contrats actifs</CardTitle>
                <Users className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.activeContracts}</div>
                <p className="text-xs text-muted-foreground">Stable</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus mensuels</CardTitle>
                <DollarSign className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.monthlyRevenue} TND</div>
                <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
                <TrendingUp className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.occupancyRate}%</div>
                <p className="text-xs text-muted-foreground">Excellent</p>
              </CardContent>
            </Card>
          </div>

          {/* Properties */}
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle>Mes biens</CardTitle>
              <CardDescription>Gérez vos propriétés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProperties.map((property) => (
                  <div key={property.id} className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{property.title}</h3>
                      <p className="text-sm text-muted-foreground">{property.price}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={property.status === "Disponible" ? "default" : "secondary"}>
                        {property.status}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {property.views} vues • {property.messages} messages
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate("/manage-properties")}
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              Dashboard {userType === "student" ? "Étudiant" : "Locataire"}
            </h1>
            <p className="text-muted-foreground">
              Bienvenue, {userProfile?.firstName} {userProfile?.lastName}
            </p>
            {userType === "student" && userProfile?.studentInfo?.university && (
              <p className="text-sm text-primary">
                📚 {userProfile.studentInfo.university}
              </p>
            )}
          </div>
          <Button onClick={() => navigate("/search")} className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Rechercher un bien</span>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/search")}>
            <CardContent className="flex flex-col items-center p-6">
              <MapPin className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium">Rechercher</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/favorites")}>
            <CardContent className="flex flex-col items-center p-6">
              <Heart className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm font-medium">Favoris</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/messages")}>
            <CardContent className="flex flex-col items-center p-6">
              <MessageSquare className="h-8 w-8 text-accent mb-2" />
              <p className="text-sm font-medium">Messages</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/contracts")}>
            <CardContent className="flex flex-col items-center p-6">
              <Calendar className="h-8 w-8 text-success mb-2" />
              <p className="text-sm font-medium">Contrats</p>
            </CardContent>
          </Card>
        </div>

        {/* Favorites */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-destructive" />
              <span>Mes favoris</span>
            </CardTitle>
            <CardDescription>Biens sauvegardés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockFavorites.map((property) => (
                <div key={property.id} className="glass-card p-4 rounded-lg cursor-pointer hover:scale-105 transition-transform">
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <Home className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{property.title}</h3>
                      <p className="text-primary font-medium">{property.price}</p>
                      <p className="text-xs text-muted-foreground flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{property.location}</span>
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
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Vos dernières actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>AK</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">Ahmed Karim a répondu à votre message</p>
                  <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>SF</AvatarFallback>
                </Avatar>
                <div>
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