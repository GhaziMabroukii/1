import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserAvatar from "./UserAvatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import UserBadge from "./UserBadge";
import { AdvancedBadgeSystem } from "./AdvancedBadgeSystem";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  MapPin, 
  Calendar, 
  Home, 
  Star, 
  MessageSquare,
  Eye,
  Phone,
  Mail,
  Shield,
  UserPlus,
  UserMinus,
  Heart,
  HeartHandshake
} from "lucide-react";

interface UserProfileProps {
  userId: number;
  onClose?: () => void;
  showContactInfo?: boolean;
}

export default function UserProfile({ userId, onClose, showContactInfo = false }: UserProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get current user info
  const currentUserId = Number(localStorage.getItem("userId"));
  const currentUserType = localStorage.getItem("userType");
  
  // Check if current user is following this profile
  const { data: followStatus } = useQuery({
    queryKey: ['/api/social/follow', userId, 'check'],
    queryFn: async () => {
      const response = await fetch(`/api/social/follow/${userId}/check`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return { isFollowing: false };
      return response.json();
    },
    enabled: !!currentUserId && currentUserId !== userId,
  });
  
  // Check if current user likes this profile
  const { data: likeStatus } = useQuery({
    queryKey: ['/api/social/profile-like', userId, 'check'],
    queryFn: async () => {
      const response = await fetch(`/api/social/profile-like/${userId}/check`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return { isLiked: false };
      return response.json();
    },
    enabled: !!currentUserId && currentUserId !== userId,
  });
  
  // Get profile like count
  const { data: profileLikeCount } = useQuery({
    queryKey: ['/api/social/profile-likes-count', userId],
    queryFn: async () => {
      const response = await fetch(`/api/social/profile-likes-count/${userId}`);
      if (!response.ok) return { likeCount: 0 };
      return response.json();
    },
  });
  
  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      if (action === 'follow') {
        return await apiRequest('/api/social/follow', {
          method: 'POST',
          body: JSON.stringify({ followingId: userId })
        });
      } else {
        return await apiRequest(`/api/social/follow/${userId}`, {
          method: 'DELETE'
        });
      }
    },
    onSuccess: (data, action) => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/follow', userId, 'check'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/follow-stats', userId] });
      toast({
        title: action === 'follow' ? "Utilisateur suivi" : "Utilisateur non suivi",
        description: action === 'follow' 
          ? "Vous suivez maintenant cet utilisateur" 
          : "Vous ne suivez plus cet utilisateur"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut de suivi",
        variant: "destructive"
      });
    }
  });
  
  // Like/Unlike mutation
  const likeMutation = useMutation({
    mutationFn: async (action: 'like' | 'unlike') => {
      if (action === 'like') {
        return await apiRequest('/api/social/profile-like', {
          method: 'POST',
          body: JSON.stringify({ likedUserId: userId })
        });
      } else {
        return await apiRequest(`/api/social/profile-like/${userId}`, {
          method: 'DELETE'
        });
      }
    },
    onSuccess: (data, action) => {
      queryClient.invalidateQueries({ queryKey: ['/api/social/profile-like', userId, 'check'] });
      queryClient.invalidateQueries({ queryKey: ['/api/social/profile-likes-count', userId] });
      toast({
        title: action === 'like' ? "Profil aimé" : "Like retiré",
        description: action === 'like' 
          ? "Vous avez aimé ce profil" 
          : "Vous n'aimez plus ce profil"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le like",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch public user profile
        const profileResponse = await fetch(`/api/users/${userId}/profile`);
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }
        const profileData = await profileResponse.json();
        setProfile(profileData);

        // Fetch user's properties if they're an owner
        if (profileData.userType === 'owner') {
          const propertiesResponse = await fetch(`/api/properties?ownerId=${userId}&limit=6`);
          if (propertiesResponse.ok) {
            const propertiesData = await propertiesResponse.json();
            setProperties(propertiesData);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleStartConversation = () => {
    navigate(`/messages?newChat=${userId}`);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 flex items-center justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">{error || "Profil utilisateur non trouvé"}</p>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="mt-4">
              Fermer
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || profile.username?.[0]?.toUpperCase() || 'U';
  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.username;
  const rating = parseFloat(profile.rating || '0');

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <UserAvatar user={profile} size="xl" />
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold">{fullName}</h2>
                  {profile.isVerified && (
                    <Shield className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <p className="text-muted-foreground capitalize">{profile.userType}</p>
                <AdvancedBadgeSystem user={profile} showAll={false} limit={3} />
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/profile/${userId}`)}
                  >
                    Voir profil social complet
                  </Button>
                </div>
              </div>
            </div>
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Rating */}
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({profile.reviewCount || 0} avis)</span>
            </div>

            {/* Trust Score */}
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{profile.trustScore || 50}%</span>
              <span className="text-sm text-muted-foreground">Confiance</span>
            </div>

            {/* Response Rate */}
            {profile.responseRate && (
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <span className="font-medium">{profile.responseRate}%</span>
                <span className="text-sm text-muted-foreground">Réponses</span>
              </div>
            )}

            {/* Member Since */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-muted-foreground">
                Membre depuis {new Date(profile.createdAt).getFullYear()}
              </span>
            </div>
          </div>

          {/* Contact Actions */}
          <div className="flex items-center space-x-2 flex-wrap">
            <Button onClick={handleStartConversation} className="flex-1 min-w-0">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter
            </Button>
            
            {/* Follow Button - Only for tenants to follow owners */}
            {currentUserId && currentUserId !== userId && currentUserType === 'tenant' && profile.userType === 'owner' && (
              <Button
                variant={followStatus?.isFollowing ? "destructive" : "outline"}
                size="sm"
                onClick={() => followMutation.mutate(followStatus?.isFollowing ? 'unfollow' : 'follow')}
                disabled={followMutation.isPending}
                data-testid={followStatus?.isFollowing ? "button-unfollow" : "button-follow"}
              >
                {followMutation.isPending ? (
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                ) : followStatus?.isFollowing ? (
                  <UserMinus className="h-4 w-4 mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                {followStatus?.isFollowing ? 'Ne plus suivre' : 'Suivre'}
              </Button>
            )}
            
            {/* Like Button - For all authenticated users except viewing their own profile */}
            {currentUserId && currentUserId !== userId && (
              <Button
                variant={likeStatus?.isLiked ? "default" : "outline"}
                size="sm"
                onClick={() => likeMutation.mutate(likeStatus?.isLiked ? 'unlike' : 'like')}
                disabled={likeMutation.isPending}
                data-testid={likeStatus?.isLiked ? "button-unlike" : "button-like"}
                className={likeStatus?.isLiked ? "bg-red-500 hover:bg-red-600" : ""}
              >
                {likeMutation.isPending ? (
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                ) : likeStatus?.isLiked ? (
                  <Heart className="h-4 w-4 mr-2 fill-current" />
                ) : (
                  <Heart className="h-4 w-4 mr-2" />
                )}
                {profileLikeCount?.likeCount || 0}
              </Button>
            )}
            
            {showContactInfo && profile.phone && (
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>{profile.phone}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bio Section */}
      {profile.bio && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>À propos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Properties Section (for owners) */}
      {profile.userType === 'owner' && properties.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Propriétés ({properties.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <div 
                  key={property.id} 
                  className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/property/${property.id}`)}
                >
                  <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                    <Home className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{property.title}</h4>
                  <p className="text-primary font-medium text-sm">{property.price} TND</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{property.address?.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{property.views || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}