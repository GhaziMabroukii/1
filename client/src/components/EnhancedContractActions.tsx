import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { EnhancedBilateralContractTermination } from '@/components/EnhancedBilateralContractTermination';

interface ContractActionsProps {
  contract: any;
  currentUserId: number;
  userType: 'tenant' | 'owner';
}

export function EnhancedContractActions({ contract, currentUserId, userType }: ContractActionsProps) {
  return (
    <EnhancedBilateralContractTermination 
      contract={contract}
      currentUserId={currentUserId}
      userType={userType}
    />
  );
}