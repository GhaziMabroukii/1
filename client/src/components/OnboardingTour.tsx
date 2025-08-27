import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, ArrowLeft, ArrowRight, MapPin, Search, MessageCircle, FileText, Heart, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetElement?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    text: string;
    href?: string;
    onClick?: () => void;
  };
}

interface OnboardingTourProps {
  userType: 'tenant' | 'owner';
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingTour = ({ userType, onComplete, onSkip }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const tenantSteps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Bienvenue sur Ekrili!",
      description: "Découvrez la plateforme de location immobilière la plus moderne de Tunisie. Nous allons vous guider à travers les fonctionnalités principales.",
      icon: <MapPin className="h-6 w-6" />,
      position: "center"
    },
    {
      id: "search",
      title: "Recherche intelligente",
      description: "Utilisez notre système de recherche avancé pour trouver le logement parfait. Filtrez par localisation, prix, type de propriété et plus encore.",
      icon: <Search className="h-6 w-6" />,
      targetElement: "[data-testid='search-input']",
      position: "bottom",
      action: {
        text: "Essayer la recherche",
        href: "/search"
      }
    },
    {
      id: "map",
      title: "Vue carte interactive",
      description: "Explorez les propriétés sur notre carte interactive avec géolocalisation. Découvrez les quartiers et les commodités à proximité.",
      icon: <MapPin className="h-6 w-6" />,
      targetElement: "[data-testid='map-view-button']",
      position: "bottom",
      action: {
        text: "Voir la carte",
        href: "/map"
      }
    },
    {
      id: "favorites",
      title: "Favoris",
      description: "Sauvegardez vos propriétés préférées pour les retrouver facilement plus tard. Vous pouvez les comparer et les partager.",
      icon: <Heart className="h-6 w-6" />,
      targetElement: "[data-testid='favorites-link']",
      position: "bottom",
      action: {
        text: "Voir mes favoris",
        href: "/favorites"
      }
    },
    {
      id: "messaging",
      title: "Messagerie en temps réel",
      description: "Communiquez directement avec les propriétaires via notre système de messagerie intégré. Partagez des documents et organisez des visites.",
      icon: <MessageCircle className="h-6 w-6" />,
      targetElement: "[data-testid='messages-link']",
      position: "bottom",
      action: {
        text: "Accéder aux messages",
        href: "/messages"
      }
    },
    {
      id: "contracts",
      title: "Gestion des contrats",
      description: "Gérez vos offres, contrats de location et signatures électroniques en toute sécurité. Suivez le statut de vos demandes en temps réel.",
      icon: <FileText className="h-6 w-6" />,
      targetElement: "[data-testid='contracts-link']",
      position: "bottom",
      action: {
        text: "Voir mes contrats",
        href: "/contracts"
      }
    },
    {
      id: "profile",
      title: "Profil personnel",
      description: "Complétez votre profil pour gagner la confiance des propriétaires. Ajoutez vos informations personnelles et documents de vérification.",
      icon: <Settings className="h-6 w-6" />,
      targetElement: "[data-testid='profile-link']",
      position: "left",
      action: {
        text: "Compléter le profil",
        href: "/profile"
      }
    }
  ];

  const ownerSteps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Bienvenue propriétaire!",
      description: "Gérez vos biens immobiliers efficacement avec Ekrili. Nous allons vous présenter tous les outils à votre disposition.",
      icon: <MapPin className="h-6 w-6" />,
      position: "center"
    },
    {
      id: "properties",
      title: "Gérer mes propriétés",
      description: "Ajoutez, modifiez et gérez vos propriétés. Téléchargez des photos, définissez les prix et les disponibilités.",
      icon: <Settings className="h-6 w-6" />,
      targetElement: "[data-testid='manage-properties-link']",
      position: "bottom",
      action: {
        text: "Gérer mes propriétés",
        href: "/manage-properties"
      }
    },
    {
      id: "add-property",
      title: "Ajouter une propriété",
      description: "Créez facilement des annonces attractives avec photos, descriptions détaillées et informations sur les commodités.",
      icon: <MapPin className="h-6 w-6" />,
      targetElement: "[data-testid='add-property-button']",
      position: "bottom",
      action: {
        text: "Ajouter une propriété",
        href: "/add-property"
      }
    },
    {
      id: "offers",
      title: "Offres et demandes",
      description: "Recevez et gérez les offres des locataires. Acceptez, refusez ou négociez les conditions directement sur la plateforme.",
      icon: <FileText className="h-6 w-6" />,
      targetElement: "[data-testid='offers-link']",
      position: "bottom",
      action: {
        text: "Voir les offres",
        href: "/offers"
      }
    },
    {
      id: "messaging",
      title: "Communication avec les locataires",
      description: "Échangez avec vos locataires potentiels et actuels via notre messagerie sécurisée. Partagez des documents et coordonnez les visites.",
      icon: <MessageCircle className="h-6 w-6" />,
      targetElement: "[data-testid='messages-link']",
      position: "bottom",
      action: {
        text: "Accéder aux messages",
        href: "/messages"
      }
    },
    {
      id: "contracts",
      title: "Contrats de location",
      description: "Créez et gérez vos contrats de location avec signatures électroniques. Suivez les paiements et les échéances.",
      icon: <FileText className="h-6 w-6" />,
      targetElement: "[data-testid='contracts-link']",
      position: "bottom",
      action: {
        text: "Gérer les contrats",
        href: "/contracts"
      }
    },
    {
      id: "dashboard",
      title: "Tableau de bord",
      description: "Surveillez vos revenus, occupations et statistiques détaillées sur vos propriétés depuis votre tableau de bord personnalisé.",
      icon: <Settings className="h-6 w-6" />,
      targetElement: "[data-testid='dashboard-link']",
      position: "left",
      action: {
        text: "Voir le tableau de bord",
        href: "/dashboard"
      }
    }
  ];

  const steps = userType === 'tenant' ? tenantSteps : ownerSteps;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('ekrili_onboarding_completed', 'true');
    setTimeout(() => onComplete(), 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('ekrili_onboarding_skipped', 'true');
    setTimeout(() => onSkip(), 300);
  };

  const getTooltipPosition = (position: string) => {
    switch (position) {
      case 'top':
        return 'bottom-full mb-2';
      case 'bottom':
        return 'top-full mt-2';
      case 'left':
        return 'right-full mr-2';
      case 'right':
        return 'left-full ml-2';
      default:
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    }
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const isCenter = currentStepData.position === 'center';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleSkip} />
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`fixed z-[60] ${
            isCenter 
              ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
              : 'top-4 left-4'
          }`}
        >
          <Card className="w-96 glass-card shadow-2xl border-2 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="gradient-primary p-2 rounded-lg">
                    {currentStepData.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {currentStep + 1} / {steps.length}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {userType === 'tenant' ? 'Locataire' : 'Propriétaire'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="h-8 w-8 p-0"
                  data-testid="close-onboarding"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <CardDescription className="text-sm leading-relaxed">
                {currentStepData.description}
              </CardDescription>

              {currentStepData.action && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (currentStepData.action?.href) {
                        window.location.href = currentStepData.action.href;
                      }
                      if (currentStepData.action?.onClick) {
                        currentStepData.action.onClick();
                      }
                    }}
                    data-testid={`onboarding-action-${currentStepData.id}`}
                  >
                    {currentStepData.action.text}
                  </Button>
                </div>
              )}

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progression</span>
                  <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  data-testid="onboarding-prev"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                    data-testid="onboarding-skip"
                  >
                    Passer
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={nextStep}
                    data-testid="onboarding-next"
                  >
                    {currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default OnboardingTour;