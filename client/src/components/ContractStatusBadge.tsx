import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, FileText, XCircle, AlertTriangle } from "lucide-react";

interface ContractStatusBadgeProps {
  status: string;
  tenantSignDeadline?: string | null;
}

export function ContractStatusBadge({ status, tenantSignDeadline }: ContractStatusBadgeProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'draft':
        return {
          label: 'Brouillon',
          variant: 'secondary' as const,
          icon: <FileText className="h-3 w-3" />
        };
      case 'owner_signed':
        const isExpired = tenantSignDeadline && new Date() > new Date(tenantSignDeadline);
        return {
          label: isExpired ? 'Expiré' : 'En attente locataire',
          variant: isExpired ? 'destructive' as const : 'default' as const,
          icon: isExpired ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />
        };
      case 'fully_signed':
        return {
          label: 'Signé complet',
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />
        };
      case 'active':
        return {
          label: 'Actif',
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />
        };
      case 'expired':
        return {
          label: 'Expiré',
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />
        };
      case 'cancelled':
        return {
          label: 'Annulé',
          variant: 'destructive' as const,
          icon: <XCircle className="h-3 w-3" />
        };
      default:
        return {
          label: status,
          variant: 'secondary' as const,
          icon: <AlertTriangle className="h-3 w-3" />
        };
    }
  };

  const { label, variant, icon } = getStatusInfo();

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {icon}
      {label}
    </Badge>
  );
}