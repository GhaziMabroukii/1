import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Star, Trophy, Clock, MessageSquare } from "lucide-react";

interface UserBadgeProps {
  user: {
    isVerified?: boolean;
    verificationLevel?: string;
    trustScore?: number;
    badges?: any[];
    rating?: string;
    responseRate?: string;
    avgResponseTime?: number;
  };
  showAll?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserBadge({ user, showAll = false, size = 'sm' }: UserBadgeProps) {
  const badgeSize = size === 'lg' ? 'h-5 w-5' : size === 'md' ? 'h-4 w-4' : 'h-3 w-3';
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs';

  const getBadges = () => {
    const badges: any[] = [];

    // Verification badge
    if (user.isVerified) {
      badges.push({
        icon: <CheckCircle className={`${badgeSize} text-blue-600`} />,
        label: "Vérifié",
        variant: "default",
        tooltip: "Utilisateur vérifié"
      });
    }

    // Trust level badges
    const trustScore = user.trustScore || 50;
    if (trustScore >= 90) {
      badges.push({
        icon: <Shield className={`${badgeSize} text-gold-600`} />,
        label: "Premium",
        variant: "secondary",
        tooltip: "Utilisateur premium avec un score de confiance élevé"
      });
    } else if (trustScore >= 75) {
      badges.push({
        icon: <Star className={`${badgeSize} text-yellow-600`} />,
        label: "Fiable",
        variant: "outline",
        tooltip: "Utilisateur fiable"
      });
    }

    // Response time badge
    const avgResponseTime = user.avgResponseTime || 24;
    if (avgResponseTime <= 2) {
      badges.push({
        icon: <Clock className={`${badgeSize} text-green-600`} />,
        label: "Réactif",
        variant: "outline",
        tooltip: "Répond rapidement (< 2h)"
      });
    }

    // High rating badge
    const rating = parseFloat(user.rating || "0");
    if (rating >= 4.5) {
      badges.push({
        icon: <Trophy className={`${badgeSize} text-purple-600`} />,
        label: "Top",
        variant: "secondary",
        tooltip: `Note excellente: ${rating}/5`
      });
    }

    // Response rate badge
    const responseRate = parseFloat(user.responseRate || "0");
    if (responseRate >= 90) {
      badges.push({
        icon: <MessageSquare className={`${badgeSize} text-blue-600`} />,
        label: "Communicatif",
        variant: "outline",
        tooltip: `Taux de réponse: ${responseRate}%`
      });
    }

    return badges;
  };

  const badges = getBadges();
  const displayBadges = showAll ? badges : badges.slice(0, 2);

  if (displayBadges.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center space-x-1 flex-wrap">
      {displayBadges.map((badge, index) => (
        <Badge
          key={index}
          variant={badge.variant as any}
          className={`${textSize} flex items-center space-x-1 px-2 py-1`}
          title={badge.tooltip}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </Badge>
      ))}
      {!showAll && badges.length > 2 && (
        <Badge variant="outline" className={`${textSize} px-2 py-1`}>
          +{badges.length - 2}
        </Badge>
      )}
    </div>
  );
}