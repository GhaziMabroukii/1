import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Shield, CheckCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ValidationCheckers from "@/components/ValidationCheckers";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationStatus, setValidationStatus] = useState({
    email: false,
    phone: false,
    password: false
  });
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Extract token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setToken(resetToken);
    } else {
      toast({
        title: "Lien invalide",
        description: "Le lien de réinitialisation est invalide ou manquant.",
        variant: "destructive",
      });
      navigate("/forgot-password");
    }
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationStatus.password) {
      toast({
        title: "Erreur",
        description: "Le mot de passe ne respecte pas les exigences.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Mot de passe réinitialisé !",
          description: data.message,
        });
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Une erreur s'est produite.",
          variant: "destructive",
        });
        
        // If token is invalid/expired, redirect to forgot password
        if (response.status === 400) {
          setTimeout(() => navigate("/forgot-password"), 2000);
        }
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="gradient-primary p-2 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">Ekrili</h1>
            </div>
            <CardTitle className="text-2xl text-green-600">Succès !</CardTitle>
            <CardDescription>
              Votre mot de passe a été réinitialisé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Votre nouveau mot de passe a été enregistré avec succès.
                </p>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold mb-2 text-green-800">Prochaines étapes :</h4>
                  <ul className="text-sm text-left list-disc list-inside space-y-1 text-green-700">
                    <li>Connectez-vous avec votre nouveau mot de passe</li>
                    <li>Assurez-vous de mémoriser ou sauvegarder ce mot de passe</li>
                    <li>Considérez activer l'authentification à deux facteurs</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/login" className="w-full">
              <Button className="w-full">
                Se connecter maintenant
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="gradient-primary p-2 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Ekrili</h1>
          </div>
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
          <CardDescription>
            Créez un mot de passe sécurisé pour votre compte
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={password ? (validationStatus.password ? 'border-green-500' : 'border-red-500') : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={confirmPassword && password !== confirmPassword ? 'border-red-500' : ''}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <ValidationCheckers
              email=""
              phone=""
              password={password}
              onValidationChange={setValidationStatus}
            />

            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-2">
                <div className="text-yellow-600 mt-0.5">🔒</div>
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Conseils de sécurité :</p>
                  <ul className="text-xs space-y-1">
                    <li>• Utilisez un mot de passe unique que vous n'utilisez nulle part ailleurs</li>
                    <li>• Considérez utiliser un gestionnaire de mots de passe</li>
                    <li>• Évitez d'inclure des informations personnelles</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={
                isLoading || 
                !validationStatus.password || 
                password !== confirmPassword
              }
            >
              {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour à la connexion
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;