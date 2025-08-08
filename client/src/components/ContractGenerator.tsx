import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "react-signature-canvas";
import { FileText, Download, PenTool, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ContractGeneratorProps {
  contract?: any;
  onSign?: (signatureData: any) => void;
  isLoading?: boolean;
  currentUserId?: number;
  // For modification mode
  initialData?: any;
  onSave?: (contractData: any) => void;
  mode?: 'view' | 'modify';
}

export default function ContractGenerator({ 
  contract, 
  onSign, 
  isLoading = false, 
  currentUserId = 1,
  initialData,
  onSave,
  mode = 'view'
}: ContractGeneratorProps) {
  const [signatureCanvas, setSignatureCanvas] = useState<SignatureCanvas | null>(null);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const { toast } = useToast();

  // Handle different modes
  const contractData = contract || initialData;
  
  // Early return if no contract data is available
  if (!contractData) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            Chargement du contrat...
          </div>
        </CardContent>
      </Card>
    );
  }

  // For modify mode, handle the contract data differently
  if (mode === 'modify' && initialData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Modification du contrat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              La fonctionnalité de modification est en cours de développement.
            </div>
            <Button 
              onClick={() => onSave && onSave(initialData)}
              disabled={isLoading}
            >
              {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine user role based on contract data
  const userRole: 'owner' | 'tenant' = currentUserId === contractData.ownerId ? 'owner' : 'tenant';
  
  const canSign = () => {
    if (userRole === 'owner') {
      // Owner can sign if they haven't signed yet, regardless of contract status
      return !contractData.ownerSignature;
    } else if (userRole === 'tenant') {
      // Tenant can sign if owner has signed but tenant hasn't
      return contractData.ownerSignature && !contractData.tenantSignature;
    }
    return false;
  };

  const handleSign = () => {
    if (!signatureCanvas || signatureCanvas.isEmpty()) {
      toast({
        title: "Signature requise",
        description: "Veuillez signer avant de valider",
        variant: "destructive",
      });
      return;
    }

    const signatureData = signatureCanvas.toDataURL();
    onSign && onSign({
      signatureType: userRole,
      signatureData: signatureData
    });
    setShowSignatureCanvas(false);
    
    toast({
      title: "Signature enregistrée",
      description: "Votre signature a été ajoutée au contrat",
    });
  };

  const clearSignature = () => {
    if (signatureCanvas) {
      signatureCanvas.clear();
    }
  };

  const generatePDF = async () => {
    const contractElement = document.getElementById('contract-content');
    if (!contractElement) return;

    try {
      const canvas = await html2canvas(contractElement);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`contrat-${contractData.id || 'draft'}.pdf`);
      
      toast({
        title: "PDF généré",
        description: "Le contrat a été téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Contract Display */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Contrat de Location #{contractData.id || 'draft'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div id="contract-content" className="space-y-4 text-sm max-w-4xl mx-auto p-6 bg-white text-black">
            <div className="text-center font-bold text-xl mb-8">
              CONTRAT DE LOCATION
            </div>
            
            <div className="text-center mb-6">
              <p>Pour</p>
              <p className="font-semibold">un appartement meublé/non meublé</p>
            </div>

            <div className="mb-6">
              <p className="font-semibold mb-2">ENTRE LES SOUSSIGNÉS :</p>
              <div className="ml-4 space-y-2">
                <p><strong>Le BAILLEUR:</strong> M. {contractData.contractData?.landlordName || contractData.landlordName || "Propriétaire"}</p>
                {(contractData.contractData?.landlordCin || contractData.landlordCin) && (
                  <p className="ml-4">CIN: {contractData.contractData?.landlordCin || contractData.landlordCin}</p>
                )}
                <p><strong>Le PRENEUR:</strong> M. {contractData.contractData?.tenantName || contractData.tenantName || "Locataire"}</p>
                {(contractData.contractData?.tenantCin || contractData.tenantCin) && (
                  <p className="ml-4">CIN: {contractData.contractData?.tenantCin || contractData.tenantCin}</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <p className="font-semibold mb-2">IL A ÉTÉ CONVENU CE QUI SUIT :</p>
              <div className="ml-4 space-y-2">
                <p>Le bailleur loue à M. {contractData.contractData?.tenantName || contractData.tenantName || "Locataire"}</p>
                <p><strong>Propriété:</strong> {contractData.contractData?.propertyTitle || contractData.propertyTitle || "Propriété"}</p>
                <p><strong>Adresse:</strong> {contractData.contractData?.propertyAddress || contractData.propertyAddress || "Adresse non spécifiée"}</p>
              </div>
            </div>

            <div className="mb-6">
              <p>Il appartient aux deux parties de constater et d'établir, par acte séparé dressé contradictoirement, l'état des lieux et la connaissance du mobilier si les locaux sont loués meublés.</p>
            </div>

            <div className="mb-6">
              <p><strong>DURÉE DU BAIL:</strong></p>
              <p className="ml-4">
                Le bail est fait pour une durée déterminée du{" "}
                {(contractData.contractData?.startDate || contractData.startDate) ? new Date(contractData.contractData?.startDate || contractData.startDate).toLocaleDateString('fr-FR') : "__/__/__"}{" "}
                au{" "}
                {(contractData.contractData?.endDate || contractData.endDate) ? new Date(contractData.contractData?.endDate || contractData.endDate).toLocaleDateString('fr-FR') : "__/__/__"}
              </p>
            </div>

            <div className="mb-6">
              <p>Le preneur pourra le dénoncer avec un préavis de trois mois entiers par lettre recommandée avec accusé de réception pendant le contrat.</p>
              <p>Le bailleur pourra le dénoncer avec un préavis d'un mois entier par lettre recommandée avec accusé de réception pendant le contrat pour un motif sérieux et légitime et conformément aux dispositions prévues par la loi.</p>
            </div>

            <div className="mb-6">
              <p className="font-semibold mb-2">OBLIGATIONS DU PRENEUR:</p>
              <p>Le présent contrat est fait aux conditions ordinaires et de droit en pareille matière à savoir la loi du 01/09/1948 ou les règles générales établies par le Code Civil. Le preneur et le bailleur s'engagent à respecter leurs obligations réciproques et notamment le preneur en vertu des obligations suivantes concernant le bon ordre et la tenue de l'immeuble et surtout l'entretien constant des locaux loués. Il devra payer le loyer au premier du mois.</p>
              <p><strong>Ce loyer s'élève actuellement à {contractData.contractData?.monthlyRent || contractData.monthlyRent || "___"} TND</strong></p>
            </div>

            <div className="mb-6">
              <p className="font-semibold mb-2">CAUTION:</p>
              <p>Le montant de la caution s'élève à {contractData.contractData?.deposit || contractData.deposit || "___"} TND</p>
            </div>

            <div className="mb-6">
              <p className="font-semibold mb-2">CLAUSES SPÉCIALES:</p>
              <p>À défaut de paiement à son échéance d'un seul terme de loyer, comme en cas d'inexécution d'une des obligations mises à la charge du preneur tant par la présente convention que par la loi et deux mois après un commandement de payer ou sommation, déférée par le bailleur, demeure sans effet, la présente location sera résiliée de plein droit sans qu'il y ait à remplir aucune formalité judiciaire.</p>
              <p>Le preneur ne peut en aucun cas procéder à une sous-location ou échange de bail de son logement.</p>
            </div>

            {(contractData.contractData?.conditions || contractData.conditions || contractData.contractData?.specialConditions || contractData.specialConditions) && (
              <div className="mb-6">
                <p className="font-semibold mb-2">CONDITIONS PARTICULIÈRES:</p>
                <p className="ml-4">{contractData.contractData?.conditions || contractData.conditions || contractData.contractData?.specialConditions || contractData.specialConditions}</p>
              </div>
            )}

            <div className="mb-6">
              <p className="font-semibold">ANNEXE AU PRÉSENT CONTRAT:</p>
              <ul className="ml-4 list-disc">
                <li>Un état des lieux d'entrée plus inventaire (quand meublé)</li>
                <li>Un contrat de garantie</li>
              </ul>
            </div>

            <div className="mb-8">
              <p>Fait en trois exemplaires</p>
              <p>Le {new Date().toLocaleDateString('fr-FR')}</p>
            </div>

            {/* Signatures Section */}
            <div className="mt-12 border-t pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="text-center">
                  <p className="font-semibold mb-4">LE BAILLEUR</p>
                  <p className="text-xs mb-2">(ajouter la mention lu et approuvé)</p>
                  {contractData.ownerSignature ? (
                    <div className="border rounded p-4 bg-white min-h-[100px] flex flex-col items-center justify-center">
                      <img src={contractData.ownerSignature} alt="Signature propriétaire" className="max-h-16 max-w-full" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Signé le {contractData.ownerSignedAt ? new Date(contractData.ownerSignedAt).toLocaleDateString('fr-FR') : ''}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/30 rounded p-4 text-center text-muted-foreground min-h-[100px] flex items-center justify-center">
                      En attente de signature
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <p className="font-semibold mb-4">LE PRENEUR</p>
                  <p className="text-xs mb-2">(ajouter la mention lu et approuvé)</p>
                  {contractData.tenantSignature ? (
                    <div className="border rounded p-4 bg-white min-h-[100px] flex flex-col items-center justify-center">
                      <img src={contractData.tenantSignature} alt="Signature locataire" className="max-h-16 max-w-full" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Signé le {contractData.tenantSignedAt ? new Date(contractData.tenantSignedAt).toLocaleDateString('fr-FR') : ''}
                      </p>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/30 rounded p-4 text-center text-muted-foreground min-h-[100px] flex items-center justify-center">
                      En attente de signature
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Role-based access */}
      <div className="flex justify-between items-center">
        {/* Download button for fully signed contracts */}
        {(contractData.ownerSignature && contractData.tenantSignature) && (
          <Button variant="outline" onClick={generatePDF}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        )}
        
        {/* Signing button - only show when it's the user's turn to sign */}
        {canSign() && (
          <Button onClick={() => setShowSignatureCanvas(true)} disabled={isLoading}>
            <PenTool className="h-4 w-4 mr-2" />
            {userRole === 'owner' ? 'Signer en tant que propriétaire' : 'Signer en tant que locataire'}
          </Button>
        )}

        {/* Status messages */}
        {userRole === 'tenant' && !contractData.ownerSignature && (
          <div className="text-sm text-muted-foreground">
            En attente de la signature du propriétaire
          </div>
        )}
        
        {userRole === 'owner' && contractData.ownerSignature && !contractData.tenantSignature && (
          <div className="text-sm text-muted-foreground">
            Contrat signé. En attente de la signature du locataire.
          </div>
        )}

        {contractData.ownerSignature && contractData.tenantSignature && (
          <div className="text-sm text-green-600 font-medium">
            Contrat entièrement signé et actif
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {showSignatureCanvas && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Signature électronique</span>
              <Button variant="ghost" size="sm" onClick={() => setShowSignatureCanvas(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Signez dans l'espace ci-dessous avec votre souris ou votre doigt
              </p>
              
              <div className="border-2 border-dashed border-primary/20 rounded-lg">
                <SignatureCanvas
                  ref={(ref) => setSignatureCanvas(ref)}
                  canvasProps={{
                    width: 500,
                    height: 200,
                    className: 'signature-canvas w-full'
                  }}
                />
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={clearSignature}>
                  Effacer
                </Button>
                <Button onClick={handleSign} disabled={isLoading}>
                  {isLoading ? "Signature en cours..." : "Valider la signature"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}