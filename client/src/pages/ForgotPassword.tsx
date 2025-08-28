import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ValidationCheckers from "@/components/ValidationCheckers";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [validationStatus, setValidationStatus] = useState({
    email: false,
    phone: false,
    password: false
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validationStatus.email) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEmailSent(true);
        toast({
          title: "Email envoyé !",
          description: data.message,
        });
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Une erreur s'est produite.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="gradient-primary p-2 rounded-xl">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">Ekrili</h1>
            </div>
            <CardTitle className="text-2xl">Email envoyé !</CardTitle>
            <CardDescription>
              Vérifiez votre boîte mail
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Un lien de réinitialisation a été envoyé à :
                </p>
                <p className="font-semibold text-primary">{email}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border">
                <h4 className="font-semibold mb-2">Étapes suivantes :</h4>
                <ol className="text-sm text-left list-decimal list-inside space-y-1">
                  <li>Ouvrez votre boîte mail</li>
                  <li>Cliquez sur le lien dans l'email d'Ekrili</li>
                  <li>Créez votre nouveau mot de passe</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground">
                Le lien expire dans 1 heure. Si vous ne voyez pas l'email, vérifiez votre dossier spam.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              onClick={() => {
                setIsEmailSent(false);
                setEmail("");
              }}
              variant="outline"
              className="w-full"
            >
              Envoyer à nouveau
            </Button>
            <Link to="/login" className="text-center w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la connexion
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
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Ekrili</h1>
          </div>
          <CardTitle className="text-2xl">Mot de passe oublié ?</CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={email ? (validationStatus.email ? 'border-green-500' : 'border-red-500') : ''}
              />
            </div>

            <ValidationCheckers
              email={email}
              phone=""
              password=""
              mode="forgot-password"
              onValidationChange={setValidationStatus}
            />

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 mt-0.5">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Comment ça marche :</p>
                  <ul className="text-xs space-y-1">
                    <li>• Un email sécurisé sera envoyé à cette adresse</li>
                    <li>• Le lien est valable 1 heure uniquement</li>
                    <li>• Vous pourrez créer un nouveau mot de passe</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !validationStatus.email}
            >
              {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
            </Button>
            <div className="text-center space-y-2">
              <Link to="/login" className="text-sm text-primary hover:underline flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour à la connexion
              </Link>
              <p className="text-xs text-muted-foreground">
                Pas encore de compte ?{" "}
                <Link to="/signup" className="text-primary hover:underline">
                  S'inscrire
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;