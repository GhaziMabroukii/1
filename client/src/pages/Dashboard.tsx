import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
  DollarSign,
  Eye,
  BarChart3,
  PieChart,
  Search
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart as RechartsPieChart, Cell } from "recharts";

const Dashboard = () => {
  const [userType, setUserType] = useState<string>("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  // Get user ID from localStorage
  const getUserId = () => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        return JSON.parse(userData).id;
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    return null;
  };

  const userId = getUserId();

  // Fetch real dashboard stats with improved caching
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats", userId, userType],
    queryFn: async () => {
      if (!userId || !userType) return null;
      const response = await fetch(`/api/dashboard/stats/${userId}?userType=${userType}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
    enabled: !!userId && !!userType,
    staleTime: 1000 * 60 * 10, // 10 minutes - longer cache
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Fetch analytics data with improved caching (lazy load)
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/dashboard/analytics", userId, userType],
    queryFn: async () => {
      if (!userId || !userType) return null;
      const response = await fetch(`/api/dashboard/analytics/${userId}?userType=${userType}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!userId && !!userType && !!dashboardStats, // Only fetch after stats loaded
    staleTime: 1000 * 60 * 15, // 15 minutes - longer cache for analytics
    refetchOnWindowFocus: false,
  });

  // Fetch user properties for owners
  const { data: userProperties } = useQuery({
    queryKey: ["/api/properties", userId],
    queryFn: async () => {
      if (!userId || userType !== 'owner') return [];
      const response = await fetch(`/api/properties?ownerId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch properties');
      return response.json();
    },
    enabled: !!userId && userType === 'owner',
  });

  // Fetch user favorites for tenants
  const { data: userFavorites } = useQuery({
    queryKey: ["/api/users/favorites", userId],
    queryFn: async () => {
      if (!userId || userType !== 'tenant') return [];
      const response = await fetch(`/api/users/${userId}/favorites`);
      if (!response.ok) throw new Error('Failed to fetch favorites');
      return response.json();
    },
    enabled: !!userId && userType === 'tenant',
  });

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

        // Removed artificial delay for better performance
        
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

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Loading state
  if (loading || statsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = dashboardStats || {};
  const analytics = analyticsData || {};
  const properties = userProperties || [];
  const favorites = userFavorites || [];

  // Property boost handler with proper authentication
  const handleBoostProperty = async (propertyId: number) => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(`/api/properties/${propertyId}/boost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        },
        body: JSON.stringify({
          boostType: 'featured',
          duration: 7
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✓ Propriété mise en avant pour 7 jours!`);
        // Refresh the properties data
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error || error.message || 'Impossible de promouvoir la propriété'}`);
      }
    } catch (error) {
      console.error('Boost property error:', error);
      alert('Erreur lors de la promotion de la propriété');
    }
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
                <div className="text-xl sm:text-2xl font-bold">{stats.totalProperties || 0}</div>
                <p className="text-xs text-muted-foreground">{stats.totalViews || 0} vues totales</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Contrats actifs</CardTitle>
                <Users className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">{stats.activeContracts || 0}</div>
                <p className="text-xs text-muted-foreground">Contrats en cours</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Revenus mensuels</CardTitle>
                <DollarSign className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-lg sm:text-2xl font-bold">{stats.monthlyRevenue || 0} TND</div>
                <p className="text-xs text-muted-foreground">Revenus actifs</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
                <CardTitle className="text-xs sm:text-sm font-medium">Taux d'occupation</CardTitle>
                <TrendingUp className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="text-xl sm:text-2xl font-bold">{stats.occupancyRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.occupancyRate >= 80 ? 'Excellent' : 
                   stats.occupancyRate >= 60 ? 'Bon' : 'À améliorer'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Charts */}
          {analytics.monthlyRevenue && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span>Revenus mensuels</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} TND`, 'Revenus']} />
                      <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span>Taux d'occupation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analytics.occupancyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Taux d\'occupation']} />
                      <Line type="monotone" dataKey="rate" stroke="#00C49F" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Properties */}
          <Card className="glass-card mb-6 sm:mb-8">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Mes biens ({properties.length})</CardTitle>
              <CardDescription className="text-sm">Gérez vos propriétés</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-4">
                {properties.length > 0 ? properties.slice(0, 3).map((property: any) => (
                  <div key={property.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-white/10 rounded-lg space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm sm:text-base">{property.title}</h3>
                      <p className="text-sm text-muted-foreground">{property.price} TND/{property.priceType}</p>
                      <p className="text-xs text-muted-foreground">{property.address}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <Badge variant={property.status === "Disponible" ? "default" : "secondary"} className="self-start sm:self-center">
                        {property.status}
                      </Badge>
                      <div className="text-xs sm:text-sm text-muted-foreground flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{property.views || 0} vues</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleBoostProperty(property.id)}
                          className="self-start sm:self-center text-xs"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Promouvoir
                        </Button>
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
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun bien pour le moment</p>
                    <Button onClick={() => navigate("/add-property")} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un bien
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Property Analytics for Owners */}
          {analytics.propertyViews && analytics.propertyViews.length > 0 && (
            <Card className="glass-card mb-6 sm:mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-accent" />
                  <span>Performance des biens</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.propertyViews}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="property" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="views" fill="#8884d8" />
                    <Bar dataKey="inquiries" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
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

        {/* Quick Stats for Tenants */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Favoris</CardTitle>
              <Heart className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold">{stats.favoritesCount || favorites.length || 0}</div>
              <p className="text-xs text-muted-foreground">Biens sauvegardés</p>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Contrats</CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold">{stats.activeContracts || 0}</div>
              <p className="text-xs text-muted-foreground">Contrats actifs</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Offres</CardTitle>
              <MessageSquare className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold">{stats.offersCount || 0}</div>
              <p className="text-xs text-muted-foreground">Offres envoyées</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold">{stats.recentActivity?.messagesCount || 0}</div>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics for Tenants */}
        {analytics.favoritesByType && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  <span>Favoris par type</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Tooltip />
                    <RechartsPieChart data={analytics.favoritesByType}>
                      {analytics.favoritesByType.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </RechartsPieChart>
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {analytics.searchActivity && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-success" />
                    <span>Activité de recherche</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analytics.searchActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}`, 'Recherches']} />
                      <Bar dataKey="searches" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Favorites */}
        <Card className="glass-card mb-6 sm:mb-8">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <Heart className="h-5 w-5 text-destructive" />
              <span>Mes favoris ({favorites.length})</span>
            </CardTitle>
            <CardDescription className="text-sm">Biens sauvegardés</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favorites.length > 0 ? favorites.slice(0, 4).map((favorite: any) => (
                <div key={favorite.id} className="glass-card p-3 sm:p-4 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                     onClick={() => navigate(`/property/${favorite.property?.id || favorite.propertyId}`)}>
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Home className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm truncate">{favorite.property?.title || favorite.title}</h3>
                      <p className="text-primary font-medium text-sm">{favorite.property?.price || favorite.price} TND</p>
                      <p className="text-xs text-muted-foreground flex items-center space-x-1 mt-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{favorite.property?.address || favorite.address}</span>
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Eye className="h-3 w-3" />
                        <span className="text-xs">{favorite.property?.views || 0} vues</span>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun favori pour le moment</p>
                  <Button onClick={() => navigate("/search")} className="mt-4">
                    <Search className="h-4 w-4 mr-2" />
                    Découvrir des biens
                  </Button>
                </div>
              )}
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