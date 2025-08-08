import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="glass border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="gradient-button p-2 rounded-xl">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold gradient-text">
                  Ekrili
                </h3>
                <p className="text-xs text-muted-foreground">
                  Location intelligente
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              La première plateforme de location intelligente adaptée aux étudiants et familles tunisiennes.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* For Tenants */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-primary">
              Locataires
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Rechercher un bien</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Espace étudiant</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Espace famille</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Mes favoris ❤️</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contrats signés</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Messagerie</a></li>
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-secondary">
              Propriétaires
            </h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Publier une annonce</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Tableau de bord</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Gestion contrats</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Suivi paiements</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Statistiques 📊</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Badge "Super Hôte" 🚀</a></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-accent">
              Support
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Mail className="h-4 w-4 text-accent" />
                <span>contact@ekrili.tn</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <Phone className="h-4 w-4 text-accent" />
                <span>+216 XX XXX XXX</span>
              </div>
              <div className="flex items-center space-x-3 text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                <span>Tunis, Tunisie 🇹🇳</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h5 className="font-semibold mb-2 text-accent">Support 24/7</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Chat en direct</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Signaler un problème</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Summary */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="glass-card">
              <h5 className="font-bold text-primary mb-2">🔍 Recherche intelligente</h5>
              <p className="text-xs text-muted-foreground">Géolocalisation précise + IA</p>
            </div>
            <div className="glass-card">
              <h5 className="font-bold text-secondary mb-2">💬 Messagerie intégrée</h5>
              <p className="text-xs text-muted-foreground">Chat temps réel + notifications</p>
            </div>
            <div className="glass-card">
              <h5 className="font-bold text-accent mb-2">🛡️ Paiements sécurisés</h5>
              <p className="text-xs text-muted-foreground">D17, Flouci + signature digitale</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2024 Ekrili. Tous droits réservés. 🇹🇳 Fièrement tunisien.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Conditions d'utilisation</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Confidentialité</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookies</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Accessibilité</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;