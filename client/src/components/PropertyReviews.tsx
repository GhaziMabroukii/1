import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PropertyReviewsProps {
  propertyId: number;
}

const PropertyReviews = ({ propertyId }: PropertyReviewsProps) => {
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reviews from database
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: [`/api/properties/${propertyId}/reviews`],
    queryFn: () => fetch(`/api/properties/${propertyId}/reviews`).then(res => res.json()),
  });

  // Create review mutation
  const createReview = useMutation({
    mutationFn: async (reviewData: any) => {
      return await apiRequest("/api/reviews", {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}/reviews`] });
      setNewReview("");
      setNewRating(0);
      toast({
        title: "Avis publié",
        description: "Votre avis a été publié avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de publier l'avis",
        variant: "destructive",
      });
    }
  });

  const averageRating = reviews.length > 0 ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length : 0;

  const handleSubmitReview = () => {
    const isAuth = localStorage.getItem("isAuthenticated");
    if (!isAuth) {
      toast({
        title: "Connexion requise",
        description: "Connectez-vous pour laisser un avis",
        variant: "destructive"
      });
      return;
    }

    if (!newReview.trim() || newRating === 0) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez donner une note et écrire un commentaire",
        variant: "destructive"
      });
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("user") || '{"id": 1}');
    const reviewData = {
      propertyId: propertyId,
      userId: currentUser.id,
      rating: newRating,
      comment: newReview.trim()
    };

    createReview.mutate(reviewData);
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:fill-yellow-400 hover:text-yellow-400' : ''}`}
            onClick={() => interactive && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Chargement des avis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Avis et commentaires</span>
          <div className="flex items-center space-x-2">
            {renderStars(Math.round(averageRating))}
            <span className="text-sm text-muted-foreground">
              ({reviews.length} avis)
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Review */}
        <div className="glass-card p-4 space-y-4">
          <h4 className="font-medium">Laisser un avis</h4>
          <div>
            <label className="text-sm font-medium mb-2 block">Note</label>
            {renderStars(newRating, true, setNewRating)}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Commentaire (optionnel)</label>
            <Textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Partagez votre expérience avec cette propriété..."
              rows={3}
            />
          </div>
          <Button 
            onClick={handleSubmitReview} 
            className="w-full"
            disabled={createReview.isPending || newRating === 0}
          >
            {createReview.isPending ? "Publication..." : "Publier l'avis"}
          </Button>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="border-b border-border/50 pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Utilisateur #{review.userId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {renderStars(review.rating)}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.createdAt), "dd MMM yyyy", { locale: fr })}
                  </span>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucun avis pour le moment</p>
            <p className="text-sm text-muted-foreground">Soyez le premier à laisser un avis!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyReviews;