import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { ArrowLeft, Settings, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SocialProfile } from '@/components/SocialProfile';
import { AdvancedBadgeSystem } from '@/components/AdvancedBadgeSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SocialProfilePage() {
  const [match, params] = useRoute('/profile/:userId');
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();
  
  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
    }
  }, []);

  if (!match || !params?.userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Profil introuvable</h1>
          <p className="text-muted-foreground">L'utilisateur demandé n'existe pas.</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const profileUserId = parseInt(params.userId);
  const isOwnProfile = currentUserId === profileUserId;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Profil Ekrili',
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Lien copié",
          description: "Le lien du profil a été copié dans le presse-papiers.",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Erreur",
        description: "Impossible de partager le profil.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              
              {isOwnProfile && (
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-16">
        <SocialProfile 
          userId={profileUserId}
          viewerUserId={currentUserId}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  );
}