import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  User, Shield, Heart, MessageCircle, Share2, Eye, Calendar, 
  MapPin, Phone, Mail, Globe, Award, Trophy, Star,
  Facebook, Instagram, Twitter, Linkedin, ExternalLink,
  Activity, BarChart3, TrendingUp, Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface SocialProfileProps {
  userId: number;
  viewerUserId?: number;
  isOwnProfile?: boolean;
}

interface UserProfileData {
  id: number;
  username: string;
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: string;
  profilePicture?: string;
  bio?: string;
  isVerified: boolean;
  disciplineScore: number;
  profileViews: number;
  trustScore: number;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  totalLogins: number;
  totalMessages: number;
  totalOffers: number;
  completedContracts: number;
  averageRating: number;
  createdAt: string;
  lastActiveAt: string;
}

interface UserPost {
  id: number;
  type: string;
  title: string;
  content?: string;
  media?: string[];
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  relatedProperty?: {
    id: number;
    title: string;
    image?: string;
  };
}

interface UserBadge {
  id: number;
  badgeId: string;
  badgeName: string;
  badgeDescription?: string;
  badgeIcon: string;
  badgeColor: string;
  rarity: string;
  category: string;
  points: number;
  earnedAt: string;
}

export const SocialProfile: React.FC<SocialProfileProps> = ({ 
  userId, 
  viewerUserId, 
  isOwnProfile = false 
}) => {
  const [activeTab, setActiveTab] = useState('posts');

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch user posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: [`/api/social/posts/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/social/posts/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user posts');
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch user badges
  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: [`/api/social/badges/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/social/badges/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user badges');
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Fetch user activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: [`/api/social/activities/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/social/activities/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user activities');
      }
      return response.json();
    },
    enabled: !!userId,
  });

  // Record profile view
  useEffect(() => {
    if (userId && viewerUserId && userId !== viewerUserId) {
      fetch('/api/social/profile-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileUserId: userId, 
          viewerUserId 
        }),
      });
    }
  }, [userId, viewerUserId]);

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Profil introuvable</h2>
            <p className="text-muted-foreground">Ce profil utilisateur n'existe pas ou n'est pas accessible.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user: UserProfileData = profile;
  const userPosts: UserPost[] = posts || [];
  const userBadges: UserBadge[] = badges || [];

  const getDisciplineColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500';
      case 'rare': return 'bg-gradient-to-r from-blue-400 to-cyan-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card className="glass-card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        <CardContent className="relative -mt-16 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarImage src={user.profilePicture} />
              <AvatarFallback className="text-xl">
                {user.firstName[0]}{user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold">
                  {user.firstName} {user.lastName}
                </h1>
                {user.isVerified && (
                  <Shield className="h-6 w-6 text-blue-600" />
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="capitalize">{user.userType}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{user.profileViews} vues</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Membre depuis {new Date(user.createdAt).getFullYear()}</span>
                </span>
              </div>

              {/* Social Links */}
              {user.socialLinks && (
                <div className="flex items-center space-x-2 pt-2">
                  {user.socialLinks.facebook && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={user.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                        <Facebook className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {user.socialLinks.instagram && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {user.socialLinks.twitter && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {user.socialLinks.linkedin && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {user.socialLinks.website && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {!isOwnProfile && (
              <div className="flex space-x-2">
                <Button>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter
                </Button>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Suivre
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${getDisciplineColor(user.disciplineScore)}`}>
              {user.disciplineScore}/100
            </div>
            <p className="text-sm text-muted-foreground">Discipline</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {user.trustScore}
            </div>
            <p className="text-sm text-muted-foreground">Confiance</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {user.completedContracts}
            </div>
            <p className="text-sm text-muted-foreground">Contrats</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {user.averageRating.toFixed(1)} ⭐
            </div>
            <p className="text-sm text-muted-foreground">Note moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Bio */}
      {user.bio && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <p className="text-muted-foreground">{user.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Badges Section */}
      {userBadges.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Badges & Récompenses</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg text-center text-white ${getRarityColor(badge.rarity)}`}
                >
                  <div className="text-2xl mb-2">{badge.badgeIcon}</div>
                  <div className="font-semibold text-sm">{badge.badgeName}</div>
                  <div className="text-xs opacity-90">{badge.points} pts</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">Publications</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="stats">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {userPosts.map((post) => (
            <Card key={post.id} className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{user.firstName} {user.lastName}</span>
                      <Badge variant="outline">{post.type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold">{post.title}</h3>
                    {post.content && <p className="text-muted-foreground">{post.content}</p>}
                    
                    {post.media && post.media.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {post.media.slice(0, 4).map((mediaUrl, index) => (
                          <img
                            key={index}
                            src={mediaUrl}
                            alt=""
                            className="rounded-lg h-32 w-full object-cover"
                          />
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-6 pt-4 text-sm text-muted-foreground">
                      <button className="flex items-center space-x-1 hover:text-red-500">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-blue-500">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-green-500">
                        <Share2 className="h-4 w-4" />
                        <span>{post.shares}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Activité récente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Connexion</p>
                    <p className="text-sm text-muted-foreground">
                      Dernière connexion: {new Date(user.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Messages envoyés</p>
                    <p className="text-sm text-muted-foreground">{user.totalMessages} messages</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-3 bg-purple-50 rounded-lg">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">Offres créées</p>
                    <p className="text-sm text-muted-foreground">{user.totalOffers} offres</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Taux de réponse</span>
                  <span className="font-semibold">95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Temps de réponse moyen</span>
                  <span className="font-semibold">2h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Taux de satisfaction</span>
                  <span className="font-semibold">98%</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Croissance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Vues ce mois</span>
                  <span className="font-semibold text-green-600">+12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Nouveaux contacts</span>
                  <span className="font-semibold text-blue-600">+8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Score de confiance</span>
                  <span className="font-semibold text-purple-600">+5%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialProfile;