import { useState } from "react";
import { useLocation } from "wouter";
import { useParams } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import UserProfile from "@/components/UserProfile";

export default function UserProfilePage() {
  const params = useParams<{ userId: string }>();
  const [, navigate] = useLocation();
  const userId = params.userId ? parseInt(params.userId) : null;

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Profil utilisateur introuvable</h1>
            <Button onClick={() => navigate("/")} variant="outline">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Button>
        </div>

        {/* User Profile */}
        <UserProfile 
          userId={userId} 
          showContactInfo={false}
        />
      </div>
    </div>
  );
}