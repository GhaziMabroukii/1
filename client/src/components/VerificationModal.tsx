import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  Phone, 
  FileText, 
  Camera, 
  Upload, 
  CheckCircle, 
  Send,
  Clock,
  Shield,
  Scan,
  AlertTriangle
} from "lucide-react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verificationType: "email" | "phone" | "document" | null;
  userProfile: any;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  verificationType,
  userProfile
}) => {
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [documentFiles, setDocumentFiles] = useState<{front?: File, back?: File}>({});
  const [documentType, setDocumentType] = useState<"cin" | "passport">("cin");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Send verification code mutation
  const sendCodeMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/verification/send-code", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      setStep(2);
      toast({
        title: "Code envoyé",
        description: verificationType === "email" 
          ? "Un code de vérification a été envoyé à votre email"
          : "Un code de vérification a été envoyé par SMS"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le code",
        variant: "destructive"
      });
    }
  });

  // Verify code mutation
  const verifyCodeMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/verification/verify-code", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Vérification réussie",
        description: verificationType === "email" 
          ? "Votre email a été vérifié avec succès"
          : "Votre téléphone a été vérifié avec succès"
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Code incorrect",
        description: "Le code de vérification est incorrect ou expiré",
        variant: "destructive"
      });
    }
  });

  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest("/api/verification/upload-document", {
        method: "POST",
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Document téléchargé",
        description: "Votre document est en cours de vérification. Vous recevrez une notification sous 24h."
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  });

  const handleSendCode = () => {
    sendCodeMutation.mutate({
      type: verificationType,
      userId: userProfile.id
    });
  };

  const handleVerifyCode = () => {
    verifyCodeMutation.mutate({
      type: verificationType,
      code: verificationCode,
      userId: userProfile.id
    });
  };

  const handleDocumentUpload = () => {
    if (!documentFiles.front) {
      toast({
        title: "Document requis",
        description: "Veuillez télécharger au moins la face avant du document",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append("documentType", documentType);
    formData.append("userId", userProfile.id.toString());
    formData.append("frontDocument", documentFiles.front);
    if (documentFiles.back) {
      formData.append("backDocument", documentFiles.back);
    }

    uploadDocumentMutation.mutate(formData);
  };

  const handleFileSelect = (type: "front" | "back", file: File) => {
    setDocumentFiles(prev => ({ ...prev, [type]: file }));
  };

  if (!verificationType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {verificationType === "email" && <Mail className="h-5 w-5" />}
            {verificationType === "phone" && <Phone className="h-5 w-5" />}
            {verificationType === "document" && <Shield className="h-5 w-5" />}
            Vérification {verificationType === "email" ? "d'email" : 
                        verificationType === "phone" ? "de téléphone" : 
                        "d'identité"}
          </DialogTitle>
        </DialogHeader>

        {verificationType === "document" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={documentType === "cin" ? "default" : "outline"}
                onClick={() => setDocumentType("cin")}
                className="h-20 flex flex-col gap-2"
              >
                <FileText className="h-6 w-6" />
                <span>Carte d'identité</span>
              </Button>
              <Button
                variant={documentType === "passport" ? "default" : "outline"}
                onClick={() => setDocumentType("passport")}
                className="h-20 flex flex-col gap-2"
              >
                <FileText className="h-6 w-6" />
                <span>Passeport</span>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Scanner/Télécharger votre {documentType === "cin" ? "CIN" : "passeport"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Face avant (obligatoire)</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {documentFiles.front ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                          <p className="text-sm text-green-600">{documentFiles.front.name}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                          <div>
                            <Button
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Prendre une photo / Télécharger
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect("front", file);
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Formats acceptés: JPG, PNG. Max 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {documentType === "cin" && (
                    <div>
                      <Label>Face arrière (optionnel)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {documentFiles.back ? (
                          <div className="space-y-2">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                            <p className="text-sm text-green-600">{documentFiles.back.name}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                            <Button
                              variant="outline"
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) handleFileSelect("back", file);
                                };
                                input.click();
                              }}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Prendre une photo / Télécharger
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-800">Conseils pour une bonne photo:</p>
                      <ul className="mt-1 text-blue-700 space-y-1">
                        <li>• Assurez-vous que le document est bien éclairé</li>
                        <li>• Le texte doit être lisible et net</li>
                        <li>• Évitez les reflets et les ombres</li>
                        <li>• Cadrez entièrement le document</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleDocumentUpload}
                  disabled={!documentFiles.front || uploadDocumentMutation.isPending}
                  className="w-full"
                >
                  {uploadDocumentMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Téléchargement en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer pour vérification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    {verificationType === "email" ? (
                      <Mail className="h-8 w-8 text-primary" />
                    ) : (
                      <Phone className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">
                    Vérifier votre {verificationType === "email" ? "adresse email" : "numéro de téléphone"}
                  </h3>
                  <p className="text-muted-foreground">
                    {verificationType === "email" 
                      ? `Un code de vérification sera envoyé à ${userProfile.email}`
                      : `Un code de vérification sera envoyé par SMS au ${userProfile.phone}`
                    }
                  </p>
                </div>

                <Button
                  onClick={handleSendCode}
                  disabled={sendCodeMutation.isPending}
                  className="w-full"
                >
                  {sendCodeMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer le code
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">Code envoyé !</h3>
                  <p className="text-muted-foreground">
                    Saisissez le code à 6 chiffres que vous avez reçu
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Code de vérification</Label>
                    <Input
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                  </div>

                  <Button
                    onClick={handleVerifyCode}
                    disabled={verificationCode.length !== 6 || verifyCodeMutation.isPending}
                    className="w-full"
                  >
                    {verifyCodeMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Vérifier le code
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-full"
                  >
                    Renvoyer le code
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};