import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Users, GraduationCap, Sliders, Filter } from "lucide-react";
import heroImage from "@/assets/hero-tunisia-modern.jpg";

const HeroSection = () => {
  const [activeUserType, setActiveUserType] = useState<"student" | "family" | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const handleSearchClick = () => {
    const isAuth = localStorage.getItem("isAuthenticated");
    const searchParams = new URLSearchParams();
    
    if (searchLocation) searchParams.set('location', searchLocation);
    if (maxPrice) searchParams.set('maxPrice', maxPrice);
    if (activeUserType) searchParams.set('userType', activeUserType);
    
    const queryString = searchParams.toString();
    const url = queryString ? `/search?${queryString}` : '/search';
    
    if (isAuth) {
      window.location.href = url;
    } else {
      window.location.href = "/login";
    }
  };

  return (
    <section className="relative min-h-[80vh] overflow-hidden">
      {/* Background with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl floating-element hidden lg:block" />
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl floating-element animation-delay-2000 hidden lg:block" />

      <div className="relative container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center slide-up">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Trouvez votre
            <span className="block gradient-text">chez-vous parfait</span>
            <span className="block text-secondary">en Tunisie</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl mb-8 text-muted-foreground max-w-2xl mx-auto">
            La première plateforme de location intelligente adaptée aux étudiants et familles tunisiennes
          </p>

          {/* User Type Selection */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              variant={activeUserType === "student" ? "success" : "glass"} 
              size="lg" 
              className="flex items-center gap-3"
              onClick={() => setActiveUserType(activeUserType === "student" ? null : "student")}
            >
              <GraduationCap className="h-5 w-5" />
              Je suis étudiant
            </Button>
            <Button 
              variant={activeUserType === "family" ? "accent" : "glass"} 
              size="lg" 
              className="flex items-center gap-3"
              onClick={() => setActiveUserType(activeUserType === "family" ? null : "family")}
            >
              <Users className="h-5 w-5" />
              Je suis une famille
            </Button>
          </div>

          {/* Search Section */}
          <div className="max-w-4xl mx-auto">
            <div className="glass-card">
              {/* Main Search Bar */}
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Où cherchez-vous ? (ex: Ariana, Tunis, Sousse...)"
                    className="glass-input w-full text-base"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                
                {/* Price Range */}
                <div className="lg:w-48">
                  <select 
                    className="glass-input w-full text-base"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  >
                    <option value="">Prix max</option>
                    <option value="300">300 TND/mois</option>
                    <option value="500">500 TND/mois</option>
                    <option value="800">800 TND/mois</option>
                    <option value="1200">1200 TND/mois</option>
                    <option value="2000">2000+ TND/mois</option>
                  </select>
                </div>

                <Button 
                  variant="default" 
                  size="lg" 
                  className="lg:w-auto"
                  onClick={handleSearchClick}
                >
                  <Search className="h-5 w-5 mr-2" />
                  Rechercher
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => navigator.geolocation?.getCurrentPosition(() => {
                    // Géolocalisation logic
                    console.log("Géolocalisation activée");
                  })}
                >
                  <MapPin className="h-4 w-4" />
                  📍 Me localiser
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtres avancés
                </Button>

                {activeUserType === "student" && (
                  <Button variant="success" size="sm">
                    🎓 Proche de mon université
                  </Button>
                )}

                {activeUserType === "family" && (
                  <Button variant="accent" size="sm">
                    👨‍👩‍👧‍👦 Family Friendly
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="mt-4 pt-4 border-t border-white/10 grid md:grid-cols-3 gap-4 slide-up">
                  <select className="glass-input">
                    <option>Type de bien</option>
                    <option>Studio</option>
                    <option>Appartement</option>
                    <option>Maison</option>
                    <option>Villa</option>
                  </select>
                  
                  <select className="glass-input">
                    <option>Durée</option>
                    <option>Court terme (jour/semaine)</option>
                    <option>Moyen terme (mois)</option>
                    <option>Long terme (année)</option>
                  </select>
                  
                  <select className="glass-input">
                    <option>Équipements</option>
                    <option>Meublé</option>
                    <option>Internet inclus</option>
                    <option>Parking</option>
                    <option>Climatisation</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="hero-button"
              onClick={() => {
                const isAuth = localStorage.getItem("isAuthenticated");
                if (isAuth) {
                  window.location.href = "/search";
                } else {
                  window.location.href = "/login";
                }
              }}
            >
              Découvrir les biens
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="hero-button-outline"
              onClick={() => {
                const isAuth = localStorage.getItem("isAuthenticated");
                if (isAuth) {
                  window.location.href = "/add-property";
                } else {
                  window.location.href = "/login";
                }
              }}
            >
              Louer mon bien
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card text-center">
              <div className="text-3xl font-bold gradient-text">2,500+</div>
              <div className="text-sm text-muted-foreground">Biens disponibles</div>
            </div>
            <div className="glass-card text-center">
              <div className="text-3xl font-bold text-secondary">24</div>
              <div className="text-sm text-muted-foreground">Gouvernorats</div>
            </div>
            <div className="glass-card text-center">
              <div className="text-3xl font-bold text-accent">15,000+</div>
              <div className="text-sm text-muted-foreground">Étudiants inscrits</div>
            </div>
            <div className="glass-card text-center">
              <div className="text-3xl font-bold text-success">24/7</div>
              <div className="text-sm text-muted-foreground">Support client</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;