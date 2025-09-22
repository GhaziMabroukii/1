import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shield, Crown, Award, Star, Zap, Target, Heart, 
  MessageCircle, TrendingUp, Calendar, Clock, 
  CheckCircle, Flame, Trophy, Medal
} from 'lucide-react';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'verification' | 'activity' | 'achievement' | 'social';
  points: number;
}

interface AdvancedBadgeSystemProps {
  user: {
    id: number;
    userType: string;
    isVerified: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    documentVerified: boolean;
    contractsCount: number;
    completedContracts: number;
    rating: number;
    averageRating: number;
    responseTime?: string;
    totalLogins: number;
    totalMessages: number;
    totalOffers: number;
    disciplineScore: number;
    trustScore: number;
    profileViews: number;
    createdAt: string;
    lastActiveAt: string;
  };
  userBadges?: BadgeData[];
  followerCount?: number;
  followingCount?: number;
  className?: string;
  showAll?: boolean;
  limit?: number;
}

export const AdvancedBadgeSystem: React.FC<AdvancedBadgeSystemProps> = ({
  user,
  userBadges = [],
  followerCount = 0,
  followingCount = 0,
  className = "",
  showAll = false,
  limit = 5
}) => {
  
  // Calculate earned badges based on user data
  const calculateEarnedBadges = (): BadgeData[] => {
    const earnedBadges: BadgeData[] = [];
    
    // Verification Badges
    if (user.isVerified) {
      earnedBadges.push({
        id: 'verified_account',
        name: 'Compte Vérifié',
        description: 'Identité vérifiée par Ekrili',
        icon: '✅',
        color: '#10B981',
        rarity: 'common',
        category: 'verification',
        points: 50
      });
    }
    
    if (user.emailVerified && user.phoneVerified && user.documentVerified) {
      earnedBadges.push({
        id: 'triple_verification',
        name: 'Triple Vérification',
        description: 'Email, téléphone et document vérifiés',
        icon: '🛡️',
        color: '#3B82F6',
        rarity: 'rare',
        category: 'verification',
        points: 100
      });
    }
    
    // Activity Badges
    if (user.totalLogins >= 100) {
      earnedBadges.push({
        id: 'active_user',
        name: 'Utilisateur Actif',
        description: 'Plus de 100 connexions',
        icon: '🔥',
        color: '#F59E0B',
        rarity: 'common',
        category: 'activity',
        points: 75
      });
    }
    
    if (user.totalMessages >= 50) {
      earnedBadges.push({
        id: 'communicator',
        name: 'Communicateur',
        description: 'Plus de 50 messages envoyés',
        icon: '💬',
        color: '#8B5CF6',
        rarity: 'common',
        category: 'social',
        points: 60
      });
    }
    
    // Achievement Badges
    if (user.userType === 'owner' && user.contractsCount >= 10) {
      earnedBadges.push({
        id: 'super_owner',
        name: 'Super Propriétaire',
        description: '10+ contrats signés',
        icon: '👑',
        color: '#F59E0B',
        rarity: 'epic',
        category: 'achievement',
        points: 200
      });
    }
    
    if (user.averageRating >= 4.5 && user.contractsCount >= 5) {
      earnedBadges.push({
        id: 'top_rated',
        name: 'Très Bien Noté',
        description: 'Note moyenne de 4.5+ avec 5+ contrats',
        icon: '⭐',
        color: '#10B981',
        rarity: 'rare',
        category: 'achievement',
        points: 150
      });
    }
    
    if (user.responseTime === 'fast') {
      earnedBadges.push({
        id: 'quick_responder',
        name: 'Réactif',
        description: 'Répond rapidement aux messages',
        icon: '⚡',
        color: '#06B6D4',
        rarity: 'common',
        category: 'social',
        points: 40
      });
    }
    
    // Discipline & Trust Badges
    if (user.disciplineScore >= 95) {
      earnedBadges.push({
        id: 'disciplined',
        name: 'Exemplaire',
        description: 'Score de discipline excellent (95+)',
        icon: '🎖️',
        color: '#DC2626',
        rarity: 'epic',
        category: 'achievement',
        points: 250
      });
    }
    
    if (user.trustScore >= 80) {
      earnedBadges.push({
        id: 'trusted',
        name: 'Digne de Confiance',
        description: 'Score de confiance élevé (80+)',
        icon: '🤝',
        color: '#059669',
        rarity: 'rare',
        category: 'social',
        points: 120
      });
    }
    
    // Popularity Badge
    if (user.profileViews >= 1000) {
      earnedBadges.push({
        id: 'popular',
        name: 'Populaire',
        description: 'Plus de 1000 vues de profil',
        icon: '👀',
        color: '#EC4899',
        rarity: 'rare',
        category: 'social',
        points: 100
      });
    }
    
    // Longevity Badge
    const memberSince = new Date(user.createdAt);
    const yearsSince = (new Date().getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (yearsSince >= 2) {
      earnedBadges.push({
        id: 'veteran',
        name: 'Vétéran',
        description: 'Membre depuis plus de 2 ans',
        icon: '🏆',
        color: '#7C3AED',
        rarity: 'epic',
        category: 'achievement',
        points: 300
      });
    } else if (yearsSince >= 1) {
      earnedBadges.push({
        id: 'experienced',
        name: 'Expérimenté',
        description: 'Membre depuis plus d\'1 an',
        icon: '🥇',
        color: '#F59E0B',
        rarity: 'rare',
        category: 'achievement',
        points: 180
      });
    }
    
    // Perfect Score Badge (Legendary)
    if (user.disciplineScore === 100 && user.trustScore >= 90 && user.averageRating >= 4.8) {
      earnedBadges.push({
        id: 'perfect',
        name: 'Parfait',
        description: 'Scores maximaux dans toutes les catégories',
        icon: '💎',
        color: '#7C3AED',
        rarity: 'legendary',
        category: 'achievement',
        points: 500
      });
    }
    
    // Follower-Based Badges (Social Influence)
    if (user.userType === 'owner') {
      // Influencer badges for owners based on follower count
      if (followerCount >= 1000) {
        earnedBadges.push({
          id: 'mega_influencer',
          name: 'Méga Influenceur',
          description: 'Plus de 1000 suiveurs',
          icon: '🌟',
          color: '#7C3AED',
          rarity: 'legendary',
          category: 'social',
          points: 500
        });
      } else if (followerCount >= 500) {
        earnedBadges.push({
          id: 'major_influencer',
          name: 'Grand Influenceur',
          description: 'Plus de 500 suiveurs',
          icon: '✨',
          color: '#EC4899',
          rarity: 'epic',
          category: 'social',
          points: 300
        });
      } else if (followerCount >= 100) {
        earnedBadges.push({
          id: 'influencer',
          name: 'Influenceur',
          description: 'Plus de 100 suiveurs',
          icon: '🎭',
          color: '#8B5CF6',
          rarity: 'rare',
          category: 'social',
          points: 150
        });
      } else if (followerCount >= 50) {
        earnedBadges.push({
          id: 'rising_star',
          name: 'Étoile Montante',
          description: 'Plus de 50 suiveurs',
          icon: '⭐',
          color: '#3B82F6',
          rarity: 'rare',
          category: 'social',
          points: 100
        });
      } else if (followerCount >= 10) {
        earnedBadges.push({
          id: 'community_builder',
          name: 'Bâtisseur de Communauté',
          description: 'Plus de 10 suiveurs',
          icon: '👥',
          color: '#10B981',
          rarity: 'common',
          category: 'social',
          points: 50
        });
      }
      
      // First follower badge
      if (followerCount >= 1) {
        earnedBadges.push({
          id: 'first_follower',
          name: 'Premier Suiveur',
          description: 'Votre premier suiveur!',
          icon: '🎉',
          color: '#F59E0B',
          rarity: 'common',
          category: 'social',
          points: 25
        });
      }
    }
    
    // Social engagement badges based on following behavior
    if (followingCount >= 50) {
      earnedBadges.push({
        id: 'network_explorer',
        name: 'Explorateur de Réseau',
        description: 'Suit plus de 50 propriétaires',
        icon: '🕵️',
        color: '#6366F1',
        rarity: 'rare',
        category: 'social',
        points: 75
      });
    } else if (followingCount >= 20) {
      earnedBadges.push({
        id: 'social_connector',
        name: 'Connecteur Social',
        description: 'Suit plus de 20 propriétaires',
        icon: '🤝',
        color: '#06B6D4',
        rarity: 'common',
        category: 'social',
        points: 40
      });
    } else if (followingCount >= 5) {
      earnedBadges.push({
        id: 'network_starter',
        name: 'Début de Réseau',
        description: 'Suit plus de 5 propriétaires',
        icon: '🌱',
        color: '#10B981',
        rarity: 'common',
        category: 'social',
        points: 20
      });
    }
    
    // Balanced social user (good follower to following ratio for owners)
    if (user.userType === 'owner' && followerCount >= 10 && followingCount >= 5) {
      const ratio = followerCount / followingCount;
      if (ratio >= 5) {
        earnedBadges.push({
          id: 'social_magnet',
          name: 'Aimant Social',
          description: 'Ratio suiveurs/suivis excellent (5:1+)',
          icon: '🧲',
          color: '#DC2626',
          rarity: 'epic',
          category: 'social',
          points: 200
        });
      } else if (ratio >= 2) {
        earnedBadges.push({
          id: 'well_connected',
          name: 'Bien Connecté',
          description: 'Bon équilibre suiveurs/suivis',
          icon: '🔗',
          color: '#059669',
          rarity: 'rare',
          category: 'social',
          points: 100
        });
      }
    }
    
    return earnedBadges;
  };
  
  const allBadges = [...userBadges, ...calculateEarnedBadges()];
  const uniqueBadges = allBadges.filter((badge, index, self) => 
    index === self.findIndex(b => b.id === badge.id)
  );
  
  const displayBadges = showAll ? uniqueBadges : uniqueBadges.slice(0, limit);
  
  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500';
      case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
    }
  };
  
  const getTotalBadgePoints = () => {
    return uniqueBadges.reduce((total, badge) => total + badge.points, 0);
  };
  
  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Badge Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">
              {uniqueBadges.length} Badge{uniqueBadges.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">
              {getTotalBadgePoints()} points
            </span>
          </div>
        </div>
        
        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {displayBadges.map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div 
                  className={`
                    relative p-3 rounded-lg text-center cursor-pointer
                    transform transition-all duration-200 hover:scale-105
                    ${getRarityGradient(badge.rarity)}
                    shadow-lg hover:shadow-xl
                  `}
                >
                  {/* Rarity Indicator */}
                  <div className="absolute top-1 right-1">
                    {badge.rarity === 'legendary' && <span className="text-xs">💎</span>}
                    {badge.rarity === 'epic' && <span className="text-xs">🔮</span>}
                    {badge.rarity === 'rare' && <span className="text-xs">✨</span>}
                  </div>
                  
                  {/* Badge Icon */}
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  
                  {/* Badge Name */}
                  <div className="text-white font-semibold text-xs leading-tight">
                    {badge.name}
                  </div>
                  
                  {/* Points */}
                  <div className="text-white/80 text-xs mt-1">
                    {badge.points} pts
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{badge.icon}</span>
                    <span className="font-semibold">{badge.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {badge.rarity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {badge.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize text-muted-foreground">
                      {badge.category}
                    </span>
                    <span className="font-medium text-yellow-600">
                      {badge.points} points
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        
        {/* Show More Link */}
        {!showAll && uniqueBadges.length > limit && (
          <div className="text-center">
            <button className="text-sm text-primary hover:underline">
              Voir tous les badges ({uniqueBadges.length})
            </button>
          </div>
        )}
        
        {/* Badge Categories Summary */}
        {showAll && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {['verification', 'activity', 'achievement', 'social'].map(category => {
              const categoryBadges = uniqueBadges.filter(b => b.category === category);
              const categoryPoints = categoryBadges.reduce((sum, b) => sum + b.points, 0);
              
              return (
                <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg text-primary">
                    {categoryBadges.length}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {category === 'verification' && 'Vérification'}
                    {category === 'activity' && 'Activité'}
                    {category === 'achievement' && 'Réussites'}
                    {category === 'social' && 'Social'}
                  </div>
                  <div className="text-xs text-yellow-600 font-medium">
                    {categoryPoints} pts
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AdvancedBadgeSystem;