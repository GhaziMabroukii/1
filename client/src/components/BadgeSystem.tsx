import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Calendar, Award, MessageCircle, Crown } from "lucide-react";

interface UserBadgesProps {
  userType: string;
  isVerified?: boolean;
  contractsCount?: number;
  rating?: number;
  responseTime?: string;
  memberSince?: string;
  className?: string;
}

interface PropertyBadgeProps {
  propertyType: "priority" | "best" | "new" | "editor" | "normal";
  className?: string;
}

export const UserBadges: React.FC<UserBadgesProps> = ({
  userType,
  isVerified = false,
  contractsCount = 0,
  rating = 0,
  responseTime,
  memberSince,
  className = ""
}) => {
  const badges = [];

  // Badge compte vérifié
  if (isVerified) {
    badges.push({
      label: "Compte vérifié",
      icon: <CheckCircle className="h-3 w-3" />,
      variant: "default" as const,
      emoji: "✅"
    });
  }

  // Badge super propriétaire
  if (userType === "owner" && rating >= 4.5 && contractsCount >= 5) {
    badges.push({
      label: "Super propriétaire",
      icon: <Crown className="h-3 w-3" />,
      variant: "default" as const,
      emoji: "🌟"
    });
  }

  // Badge propriétaire actif
  if (userType === "owner" && contractsCount > 0) {
    badges.push({
      label: "Propriétaire actif",
      icon: <Award className="h-3 w-3" />,
      variant: "secondary" as const,
      emoji: "📷"
    });
  }

  // Badge contrats signés
  if (contractsCount > 0) {
    badges.push({
      label: `${contractsCount} contrat${contractsCount > 1 ? 's' : ''} signé${contractsCount > 1 ? 's' : ''}`,
      icon: <Award className="h-3 w-3" />,
      variant: "outline" as const,
      emoji: "🧾"
    });
  }

  // Badge réactif
  if (responseTime === "fast") {
    badges.push({
      label: "Réactif",
      icon: <MessageCircle className="h-3 w-3" />,
      variant: "secondary" as const,
      emoji: "💬"
    });
  }

  // Badge ancienneté
  if (memberSince) {
    const years = new Date().getFullYear() - new Date(memberSince).getFullYear();
    if (years >= 1) {
      badges.push({
        label: `${years} an${years > 1 ? 's' : ''} d'ancienneté`,
        icon: <Calendar className="h-3 w-3" />,
        variant: "outline" as const,
        emoji: "🎖"
      });
    }
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {badges.map((badge, index) => (
        <Badge key={index} variant={badge.variant} className="text-xs flex items-center gap-1">
          <span>{badge.emoji}</span>
          <span>{badge.label}</span>
        </Badge>
      ))}
    </div>
  );
};

export const PropertyBadge: React.FC<PropertyBadgeProps> = ({ propertyType, className = "" }) => {
  const getBadgeConfig = () => {
    switch (propertyType) {
      case "priority":
        return {
          label: "Prioritaire",
          emoji: "🔝",
          variant: "default" as const,
          description: "Super propriétaire"
        };
      case "best":
        return {
          label: "Best of",
          emoji: "🌟",
          variant: "default" as const,
          description: "Meilleur avis"
        };
      case "new":
        return {
          label: "Nouveau",
          emoji: "🆕",
          variant: "secondary" as const,
          description: "Moins de 7 jours"
        };
      case "editor":
        return {
          label: "Choix de la rédaction",
          emoji: "📌",
          variant: "outline" as const,
          description: "Sélection manuelle"
        };
      default:
        return null;
    }
  };

  const config = getBadgeConfig();
  if (!config) return null;

  return (
    <Badge variant={config.variant} className={`text-xs flex items-center gap-1 ${className}`}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </Badge>
  );
};

export const getPropertyBadgeType = (property: any): "priority" | "best" | "new" | "editor" | "normal" => {
  // Propriété nouvelle (moins de 7 jours)
  const createdDate = new Date(property.createdAt || Date.now());
  const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 7) {
    return "new";
  }

  // Best of (rating élevé)
  if (property.rating >= 4.8 && property.reviews >= 10) {
    return "best";
  }

  // Prioritaire (super propriétaire)
  if (property.owner?.isVerified && property.owner?.rating >= 4.5) {
    return "priority";
  }

  // Choix de la rédaction (flag spécial)
  if (property.editorChoice) {
    return "editor";
  }

  return "normal";
};