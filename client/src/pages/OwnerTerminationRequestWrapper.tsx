import { useRoute } from 'wouter';
import OwnerTerminationRequest from './OwnerTerminationRequest';

export function OwnerTerminationRequestWrapper() {
  const [match, params] = useRoute("/owner-termination-request/:contractId");
  const contractId = params?.contractId ? parseInt(params.contractId) : 0;
  const currentUserId = Number(localStorage.getItem("userId")) || 0;
  
  return (
    <OwnerTerminationRequest 
      contractId={contractId} 
      currentUserId={currentUserId} 
    />
  );
}

export default OwnerTerminationRequestWrapper;