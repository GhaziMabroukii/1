import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, Menu, Bell, Heart, User, Search, LogOut, Home, Settings, FileText, AlertCircle, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TenantRequestsDropdown } from "./TenantRequestsDropdown";
import { OwnerRequestsDropdown } from "./OwnerRequestsDropdown";
import { NotificationCenter } from "./NotificationCenter";

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userType, setUserType] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const updateUserState = () => {
      const authStatus = localStorage.getItem("isAuthenticated");
      const userData = localStorage.getItem("userData");
      const userType = localStorage.getItem("userType");
      
      console.log("Header auth check:", { authStatus, userData: !!userData, userType });
      
      if (authStatus && userData && userType) {
        try {
          const user = JSON.parse(userData);
          setIsAuthenticated(true);
          setUserEmail(user.email || user.username || "");
          setUserType(userType);
          setUserId(user.id);
          console.log("Header: Set user type to:", userType, "with user ID:", user.id);
        } catch (error) {
          console.error("Error parsing user data:", error);
          setIsAuthenticated(false);
          setUserEmail("");
          setUserType("");
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail("");
        setUserType("");
        setUserId(null);
      }
    };

    // Initial load
    updateUserState();

    // Listen for storage changes
    window.addEventListener('storage', updateUserState);
    window.addEventListener('focus', updateUserState);
    
    // Check for changes every second (since localStorage changes in same tab don't trigger storage event)
    const interval = setInterval(updateUserState, 1000);

    return () => {
      window.removeEventListener('storage', updateUserState);
      window.removeEventListener('focus', updateUserState);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userProfile");
    localStorage.removeItem("user");
    localStorage.clear(); // Ensure everything is cleared
    
    setIsAuthenticated(false);
    setUserEmail("");
    setUserType("");
    
    console.log("Logout: Cleared all localStorage and state");
    navigate("/login");
  };





  return (
    <header className="glass sticky top-0 z-50 border-b border-white/10">
      <div className="container mx-auto px-4 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <div className="gradient-button p-1.5 sm:p-2 rounded-xl">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text">
                Ekrili
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Location intelligente
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link to="/search" className="text-foreground hover:text-primary transition-colors font-medium">
              Découvrir
            </Link>
            <Link to="/map" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-1">
              🗺️ Carte
            </Link>
            <Link to="/search?filter=student" className="text-foreground hover:text-primary transition-colors font-medium">
              Pour étudiants
            </Link>
            <Link to="/search?filter=family" className="text-foreground hover:text-primary transition-colors font-medium">
              Pour familles
            </Link>
            {(userType === "owner" || !isAuthenticated) && (
              <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors font-medium">
                Louer mon bien
              </Link>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {isAuthenticated && (
              <>
                {/* Tenant/Owner Requests Dropdowns - Hidden on mobile, shown in mobile menu */}
                <div className="hidden lg:flex items-center space-x-2">
                  {userType === "tenant" && (() => {
                    const userData = localStorage.getItem("userData");
                    const userId = userData ? JSON.parse(userData).id : 7;
                    return (
                      <TenantRequestsDropdown 
                        userId={userId} 
                        userType={userType} 
                      />
                    );
                  })()}
                  
                  {userType === "owner" && (() => {
                    const userData = localStorage.getItem("userData");
                    const userId = userData ? JSON.parse(userData).id : 1;
                    return (
                      <OwnerRequestsDropdown 
                        userId={userId} 
                        userType={userType} 
                      />
                    );
                  })()}
                </div>
                
                {/* Quick Actions - Responsive */}
                <div className="hidden sm:flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative"
                    onClick={() => navigate("/notifications")}
                  >
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-primary rounded-full text-xs"></span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate("/favorites")}
                  >
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate("/messages")}
                  >
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </Button>
                </div>

                {/* Search on smaller screens */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="sm:hidden"
                  onClick={() => navigate("/search")}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </>
            )}

            {/* Auth Buttons / User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarFallback className="text-xs sm:text-sm">
                        {userEmail.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none truncate">{userEmail}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {localStorage.getItem("userType") || "utilisateur"}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/search")}>
                    <Search className="mr-2 h-4 w-4" />
                    Rechercher
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/messages")}>
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Messages
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate("/favorites")}>
                     <Heart className="mr-2 h-4 w-4" />
                     Favoris
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate("/offers")}>
                     <FileText className="mr-2 h-4 w-4" />
                     {userType === "owner" ? "Mes offres reçues" : "Mes offres envoyées"}
                   </DropdownMenuItem>
                   {userType === "owner" && (
                     <>
                       <DropdownMenuItem onClick={() => navigate("/add-property")}>
                         <Home className="mr-2 h-4 w-4" />
                         Louer mon bien
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => navigate("/manage-properties")}>
                         <Settings className="mr-2 h-4 w-4" />
                         Gérer mes biens
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => navigate("/contracts")}>
                         <FileText className="mr-2 h-4 w-4" />
                         Contrats
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => navigate("/contract-termination")}>
                         <AlertCircle className="mr-2 h-4 w-4" />
                         Arrêt de Contrat
                       </DropdownMenuItem>
                     </>
                   )}
                   {userType === "tenant" && (
                     <>
                       <DropdownMenuItem onClick={() => navigate("/contracts")}>
                         <FileText className="mr-2 h-4 w-4" />
                         Mes contrats
                       </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => navigate("/contract-termination")}>
                         <AlertCircle className="mr-2 h-4 w-4" />
                         Arrêt de Contrat
                       </DropdownMenuItem>
                     </>
                   )}
                   <DropdownMenuItem onClick={() => navigate("/notifications")}>
                     <Bell className="mr-2 h-4 w-4" />
                     Notifications
                   </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => navigate("/profile")}>
                     <User className="mr-2 h-4 w-4" />
                     Mon profil
                   </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-xs sm:text-sm">
                  Connexion
                </Button>
                <Button variant="default" size="sm" onClick={() => navigate("/signup")} className="text-xs sm:text-sm">
                  S'inscrire
                </Button>
              </div>
            )}

            {/* Mobile Menu with Sheet */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center space-x-2">
                      <div className="gradient-button p-2 rounded-xl">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold gradient-text">Ekrili</h2>
                        <p className="text-xs text-muted-foreground">Menu</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 py-4">
                    {/* Mobile Navigation Links */}
                    <div className="space-y-2 mb-6">
                      <Link 
                        to="/search" 
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Search className="h-5 w-5 text-primary" />
                        <span className="font-medium">Découvrir</span>
                      </Link>
                      <Link 
                        to="/map" 
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <MapPin className="h-5 w-5 text-primary" />
                        <span className="font-medium">🗺️ Carte</span>
                      </Link>
                      <Link 
                        to="/search?filter=student" 
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-5 w-5 text-primary" />
                        <span className="font-medium">Pour étudiants</span>
                      </Link>
                      <Link 
                        to="/search?filter=family" 
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Home className="h-5 w-5 text-primary" />
                        <span className="font-medium">Pour familles</span>
                      </Link>
                      {(userType === "owner" || !isAuthenticated) && (
                        <Link 
                          to="/dashboard" 
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="h-5 w-5 text-primary" />
                          <span className="font-medium">Louer mon bien</span>
                        </Link>
                      )}
                    </div>

                    {/* Mobile Quick Actions for authenticated users */}
                    {isAuthenticated && (
                      <div className="border-t pt-4 mb-6">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-3">Actions rapides</h3>
                        <div className="space-y-2">
                          <button 
                            onClick={() => {navigate("/notifications"); setIsMobileMenuOpen(false);}}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors w-full text-left"
                          >
                            <div className="relative">
                              <Bell className="h-5 w-5 text-accent" />
                            </div>
                            <span className="font-medium">Notifications</span>
                          </button>
                          <button 
                            onClick={() => {navigate("/favorites"); setIsMobileMenuOpen(false);}}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors w-full text-left"
                          >
                            <Heart className="h-5 w-5 text-destructive" />
                            <span className="font-medium">Favoris</span>
                          </button>
                          <button 
                            onClick={() => {navigate("/messages"); setIsMobileMenuOpen(false);}}
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors w-full text-left"
                          >
                            <svg className="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="font-medium">Messages</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mobile Auth Section */}
                    {!isAuthenticated && (
                      <div className="border-t pt-4 space-y-3">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start" 
                          onClick={() => {navigate("/login"); setIsMobileMenuOpen(false);}}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Connexion
                        </Button>
                        <Button 
                          className="w-full justify-start" 
                          onClick={() => {navigate("/signup"); setIsMobileMenuOpen(false);}}
                        >
                          <User className="mr-2 h-4 w-4" />
                          S'inscrire
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;