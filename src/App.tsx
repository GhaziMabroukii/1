import { BlinkProvider, BlinkAuthProvider, useBlinkAuth } from '@blinkdotnew/react'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Router, Route, Switch } from "wouter";
import { blink } from './lib/blink'

// Import pages
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
import ContractVersions from "./pages/ContractVersions";
import ContractVersionView from "./pages/ContractVersionView";
import ContractTerminationStatus from "./pages/ContractTerminationStatus";
import EmailVerification from "./pages/EmailVerification";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SocialProfilePage from "./pages/SocialProfilePage";

function getProjectId(): string {
  const envId = import.meta.env.VITE_BLINK_PROJECT_ID
  if (envId) return envId
  const hostname = window.location.hostname
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/)
  if (match) return match[1]
  return 'ekrili-rentals-app-91sv24m9'
}

function AppContent() {
  const { isAuthenticated, isLoading } = useBlinkAuth()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

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
            <Route path="/verify-email" component={EmailVerification} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/reset-password" component={ResetPassword} />
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
            <Route path="/profile/:userId" component={SocialProfilePage} />
            <Route path="/edit-property/:id" component={EditProperty} />
            <Route path="/map" component={MapView} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/offers" component={Offers} />
            <Route path="/contract-termination-status/:requestId" component={ContractTerminationStatus} />
            <Route component={NotFound} />
          </Switch>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

function App() {
  return (
    <BlinkProvider 
      projectId={getProjectId()}
      publishableKey={import.meta.env.VITE_BLINK_PUBLISHABLE_KEY}
    >
      <BlinkAuthProvider>
        <AppContent />
      </BlinkAuthProvider>
    </BlinkProvider>
  )
}

export default App 