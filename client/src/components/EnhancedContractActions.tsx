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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border space-y-6">
        {/* Enhanced Bilateral Contract Termination Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Arrêt de Contrat Bilatéral
          </h3>
          <p className="text-sm text-gray-600">
            Système complet d'arrêt de contrat avec confirmation des deux parties et signatures électroniques.
          </p>
          
          <EnhancedBilateralContractTermination 
            contract={contract}
            currentUserId={currentUserId}
            userType={userType}
          />
        </div>
      </div>
    </div>
  );
}