import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import PropertyDetails from "./pages/PropertyDetails";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";
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
import ContractVersions from "./pages/ContractVersions";
import ContractVersionView from "./pages/ContractVersionView";

const queryClient = new QueryClient();

const App = () => (
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
          <Route component={NotFound} />
        </Switch>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
