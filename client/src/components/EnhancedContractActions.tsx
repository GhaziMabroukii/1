import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { EnhancedBilateralContractTermination } from '@/components/EnhancedBilateralContractTermination';

interface ContractActionsProps {
  contract: any;
  currentUserId: number;
  userType: 'tenant' | 'owner';
}

const ContractRenewalButton = ({ contract, currentUserId, userType }: ContractActionsProps) => {
  const [isRenewing, setIsRenewing] = useState(false);
  const { toast } = useToast();
  
  // Check if contract is expired or about to expire
  const contractEndDate = new Date(contract.contractEndDate);
  const today = new Date();
  const isExpired = contractEndDate < today;
  const daysUntilExpiry = Math.ceil((contractEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isNearExpiry = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  
  if (!isExpired && !isNearExpiry) {
    return null; // Don't show renewal button if contract is not near expiry
  }
  
  const handleRenewal = async () => {
    setIsRenewing(true);
    try {
      const response = await fetch(`/api/contracts/${contract.id}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestedBy: currentUserId,
          userType: userType,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate renewal');
      }
      
      const result = await response.json();
      toast({
        title: "Demande de renouvellement envoyée",
        description: "L'autre partie sera notifiée de votre demande de renouvellement.",
      });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'initier le renouvellement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsRenewing(false);
    }
  };
  
  return (
    <Button
      onClick={handleRenewal}
      disabled={isRenewing}
      variant={isExpired ? "destructive" : "outline"}
      size="sm"
      className="ml-2"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRenewing ? 'animate-spin' : ''}`} />
      {isExpired ? 'Renouveler (Expiré)' : `Renouveler (${daysUntilExpiry}j)`}
    </Button>
  );
};

export function EnhancedContractActions({ contract, currentUserId, userType }: ContractActionsProps) {
  return (
    <div className="flex items-center">
      <EnhancedBilateralContractTermination 
        contract={contract}
        currentUserId={currentUserId}
        userType={userType}
      />
      <ContractRenewalButton 
        contract={contract}
        currentUserId={currentUserId}
        userType={userType}
      />
    </div>
  );
}