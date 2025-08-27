import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, RotateCcw } from "lucide-react";

export default function EmailVerification() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Get email from URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const emailFromUrl = urlParams.get('email') || '';
  
  // Use email from URL or let user enter it
  useState(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  });

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !verificationCode) {
      toast({
        title: "Champs requis",
        description: "Veuillez saisir votre email et le code de vérification.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          code: verificationCode.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsVerified(true);
        
        // Store authentication data
        if (data.token) {
          console.log("Storing auth data:", data);
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("userData", JSON.stringify(data.user)); // Header looks for this
          localStorage.setItem("userType", data.userType);
          localStorage.setItem("isAuthenticated", "true");
          
          // Verify storage was successful
          console.log("Verification: Stored userData:", localStorage.getItem("userData"));
          console.log("Verification: Stored isAuthenticated:", localStorage.getItem("isAuthenticated"));
          console.log("Verification: Stored userType:", localStorage.getItem("userType"));
        }

        toast({
          title: "Email vérifié !",
          description: data.message || "Votre email a été vérifié avec succès.",
        });

        // Force page refresh to update authentication state, then redirect
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        toast({
          title: "Erreur de vérification",
          description: data.error || "Code de vérification invalide.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir votre adresse email.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Code renvoyé",
          description: data.message || "Un nouveau code de vérification a été envoyé.",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de renvoyer le code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">
              Email vérifié !
            </CardTitle>
            <CardDescription>
              Votre compte a été activé avec succès. Redirection en cours...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
            Vérification Email
          </CardTitle>
          <CardDescription>
            Saisissez le code de vérification envoyé à votre adresse email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!emailFromUrl}
                data-testid="input-email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Code de vérification</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
                data-testid="input-verification-code"
                required
              />
              <p className="text-xs text-gray-500 text-center">
                Code à 6 chiffres envoyé par email
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              disabled={isVerifying}
              data-testid="button-verify"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Vérifier l'email"
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-sm"
                data-testid="button-resend"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Renvoyer le code
                  </>
                )}
              </Button>
            </div>

            <div className="text-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
                data-testid="button-back-home"
              >
                Retour à l'accueil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}