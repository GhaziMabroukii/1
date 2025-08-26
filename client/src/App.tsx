import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { useGlobalWebSocket } from "./hooks/useWebSocket";
import AIAssistantWrapper from "./components/AIAssistantWrapper";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import PropertyDetails from "./pages/PropertyDetails";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";
import Compare from "./pages/Compare";
import AddProperty from "./pages/AddProperty";
import ManageProperties from "./pages/ManageProperties";
import Contracts from "./pages/Contracts";
import Notifications from "./pages/Notifications";
import CreateContract from "./pages/CreateContract";
import ContractView from "./pages/ContractView";
import ContractsDashboard from "./pages/ContractsDashboard";
import UserProfile from "./pages/UserProfile";
import EditProperty from "./pages/EditProperty";
import MapView from "./pages/MapView";
import Offers from "./pages/Offers";
import TenantRequestResponse from "./pages/TenantRequestResponse";
import OwnerRequestResponse from "./pages/OwnerRequestResponse";
import ContractVersions from "./pages/ContractVersions";
import ContractVersionView from "./pages/ContractVersionView";
import ContractTerminationStatus from "./pages/ContractTerminationStatus";
import TenantTerminationRequestWrapper from "./pages/TenantTerminationRequestWrapper";
import OwnerTerminationRequestWrapper from "./pages/OwnerTerminationRequestWrapper";
import OwnerTerminationReview from "./pages/OwnerTerminationReview";
import OwnerTerminationWorkflow from "./pages/OwnerTerminationWorkflow";
import TenantTerminationWorkflow from "./pages/TenantTerminationWorkflow";
import ContractTermination from "./pages/ContractTermination";

const queryClient = new QueryClient();

const App = () => {
  // Initialize global WebSocket connection for real-time updates
  useGlobalWebSocket();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/search" component={Search} />
            <Route path="/property/:id" component={PropertyDetails} />
            <Route path="/messages" component={Messages} />
            <Route path="/favorites" component={Favorites} />
            <Route path="/compare" component={Compare} />
            <Route path="/add-property" component={AddProperty} />
            <Route path="/manage-properties" component={ManageProperties} />
            <Route path="/contracts" component={ContractsDashboard} />
            <Route path="/create-contract" component={CreateContract} />
            <Route path="/contract/:id" component={ContractView} />
            <Route path="/contract/:id/versions" component={ContractVersions} />
            <Route path="/contract/:contractId/version/:versionId" component={ContractVersionView} />
            <Route path="/profile" component={UserProfile} />
            <Route path="/edit-property/:id" component={EditProperty} />
            <Route path="/map" component={MapView} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/offers" component={Offers} />
            <Route path="/tenant-requests/:type/:id" component={TenantRequestResponse} />
            <Route path="/tenant-request-response/:id" component={TenantRequestResponse} />
            <Route path="/owner-request-response/:type/:id" component={OwnerRequestResponse} />
            <Route path="/tenant-termination-request/:contractId" component={TenantTerminationRequestWrapper} />
            <Route path="/owner-termination-request/:contractId" component={OwnerTerminationRequestWrapper} />
            <Route path="/owner-termination-review/:requestId" component={OwnerTerminationReview} />
            <Route path="/owner-termination-workflow/:requestId" component={OwnerTerminationWorkflow} />
            <Route path="/tenant-termination-workflow/:requestId?" component={TenantTerminationWorkflow} />
            <Route path="/contract-termination" component={ContractTermination} />
            <Route path="/contract-termination-status/:requestId" component={ContractTerminationStatus} />
            <Route component={NotFound} />
          </Switch>
          {/* Global AI Assistant */}
          <AIAssistantWrapper />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
