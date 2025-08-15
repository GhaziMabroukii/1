import { useRoute } from 'wouter';
import TenantTerminationRequest from './TenantTerminationRequest';

export function TenantTerminationRequestWrapper() {
  const [match, params] = useRoute("/tenant-termination-request/:contractId");
  const contractId = params?.contractId ? parseInt(params.contractId) : 0;
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"id": 0}');
  
  return (
    <TenantTerminationRequest 
      contractId={contractId} 
      currentUserId={currentUser.id} 
    />
  );
}

export default TenantTerminationRequestWrapper;