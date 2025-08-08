import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  MessageSquare, 
  Shield, 
  Zap, 
  Users, 
  GraduationCap,
  Search,
  Heart,
  Calendar,
  Phone,
  Star
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: MapPin,
      title: "Géolocalisation précise",
      description: "Recherche dans un rayon de 1-5km avec clustering dynamique et repères locaux (universités, mosquées, cafés)",
      benefits: ["📍 Me localiser", "🗺️ Carte interactive", "📍 Adresses précises"],
      color: "text-primary"
    },
    {
      icon: MessageSquare,
      title: "Messagerie temps réel",
      description: "Chat intégré avec notifications push personnalisées et historique des conversations",
      benefits: ["💬 Chat en direct", "🔔 Notifications", "📱 SMS/Email"],
      color: "text-secondary"
    },
    {
      icon: Shield,
      title: "Contrats sécurisés",
      description: "Signature électronique, paiements D17/Flouci, et vérification d'identité CIN obligatoire",
      benefits: ["✍️ Signature digitale", "💳 Paiement sécurisé", "🆔 Vérification CIN"],
      color: "text-accent"
    },
    {
      icon: Zap,
      title: "Prix flexibles",
      description: "Tarification jour/semaine/mois/année avec slider multi-échelle adapté à vos besoins",
      benefits: ["📅 Tarifs flexibles", "💰 Prix transparent", "📊 Comparaison facile"],
      color: "text-success"
    },
    {
      icon: GraduationCap,
      title: "Spécial étudiants",
      description: "Filtres par université (ENSI, IHEC, Tunis El Manar), colocation possible, garantie parentale",
      benefits: ["🎓 Proche universités", "👥 Colocation", "📋 Garantie parentale"],
      color: "text-warning"
    },
    {
      icon: Users,
      title: "Family Friendly",
      description: "Biens avec jardins sécurisés, proximité écoles/parcs, messagerie de groupe familiale",
      benefits: ["🏡 Jardins sécurisés", "🏫 Proche écoles", "👨‍👩‍👧‍👦 Décisions familiales"],
      color: "text-destructive"
    }
  ];

  const studentFeatures = [
    { icon: Search, title: "Recherche par université", desc: "ENSI, IHEC, Tunis El Manar..." },
    { icon: Users, title: "Colocation", desc: "Partagez avec d'autres étudiants" },
    { icon: Shield, title: "Garantie parentale", desc: "Sécurité pour les parents" },
    { icon: Zap, title: "Internet inclus", desc: "WiFi haut débit garanti" }
  ];

  const familyFeatures = [
    { icon: Shield, title: "Jardins sécurisés", desc: "Espaces verts protégés" },
    { icon: GraduationCap, title: "Proche écoles", desc: "À pied des établissements" },
    { icon: Users, title: "Messagerie groupe", desc: "Décisions collectives" },
    { icon: Heart, title: "Espaces familiaux", desc: "Adapté aux enfants" }
  ];

  return (
    <div className="py-20 space-y-20">
      {/* Main Features */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-16 slide-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Une plateforme
            <span className="block gradient-text">intelligente & complète</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Toutes les fonctionnalités pensées pour simplifier la location immobilière en Tunisie
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="glass-card hover:scale-105 transition-all duration-300 group">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-4 ${feature.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <div className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <div key={idx} className="text-xs bg-muted/50 rounded-lg px-3 py-2">
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Student Section */}
      <section className="bg-gradient-to-r from-success/5 to-accent/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="slide-up">
                <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <GraduationCap className="h-4 w-4" />
                  Spécial Étudiants
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  Trouve ton studio près de ton
                  <span className="block gradient-text">université</span>
                </h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  Recherche optimisée pour les étudiants tunisiens avec filtres spécialisés et géolocalisation précise
                </p>
                
                <div className="space-y-4 mb-8">
                  {studentFeatures.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="bg-success/10 p-2 rounded-lg">
                          <Icon className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button variant="success" size="lg">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Rechercher pour étudiants
                </Button>
              </div>
              
              <div className="glass-card bg-gradient-to-br from-success/10 to-transparent">
                <div className="space-y-4">
                  <div className="border-l-4 border-success pl-4">
                    <h4 className="font-bold text-success">Exemple: Studio ENSI</h4>
                    <p className="text-sm text-muted-foreground">200m de l'ENSI, 5min à pied 🚶‍♂️</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Prix:</span>
                      <p>400 TND/mois</p>
                    </div>
                    <div>
                      <span className="font-semibold">Inclus:</span>
                      <p>Wi-Fi, Clim, Électricité</p>
                    </div>
                    <div>
                      <span className="font-semibold">Colocation:</span>
                      <p>✅ 2 personnes max</p>
                    </div>
                    <div>
                      <span className="font-semibold">Transport:</span>
                      <p>Bus direct campus</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Family Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="glass-card bg-gradient-to-br from-accent/10 to-transparent lg:order-2">
                <div className="space-y-4">
                  <div className="border-l-4 border-accent pl-4">
                    <h4 className="font-bold text-accent">Exemple: Villa Sidi Bou Saïd</h4>
                    <p className="text-sm text-muted-foreground">4 pièces, jardin sécurisé, proche école 🏫</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold">Surface:</span>
                      <p>120m² + jardin</p>
                    </div>
                    <div>
                      <span className="font-semibold">Sécurité:</span>
                      <p>Gardien 24h/24</p>
                    </div>
                    <div>
                      <span className="font-semibold">École:</span>
                      <p>300m École Primaire</p>
                    </div>
                    <div>
                      <span className="font-semibold">Loisirs:</span>
                      <p>Parc public 200m</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="slide-up lg:order-1">
                <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-semibold mb-6">
                  <Users className="h-4 w-4" />
                  Spécial Familles
                </div>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  Un foyer sûr pour votre
                  <span className="block gradient-text">famille</span>
                </h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  Biens sélectionnés avec critères familiaux : sécurité, proximité écoles et espaces verts
                </p>
                
                <div className="space-y-4 mb-8">
                  {familyFeatures.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="bg-accent/10 p-2 rounded-lg">
                          <Icon className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button variant="accent" size="lg">
                  <Users className="h-5 w-5 mr-2" />
                  Rechercher pour familles
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4">
        <div className="glass-card bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 text-center max-w-4xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Prêt à trouver votre prochain chez-vous ?
          </h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'étudiants et familles qui ont trouvé leur logement idéal sur Ekrili
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" size="lg" className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Commencer ma recherche
            </Button>
            <Button variant="outline" size="lg" className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Voir les biens populaires
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesSection;