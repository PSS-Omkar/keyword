import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Campaigns from "@/pages/campaigns";
import Advertisers from "@/pages/advertisers";
import Keywords from "@/pages/keywords";
import TrafficSources from "@/pages/traffic-sources";
import ApiPage from "@/pages/api";
import MetaAds from "@/pages/meta-ads";
import Privacy from "@/pages/privacy";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, error } = useAuth();

  // Show loading state during authentication check
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Always show authenticated routes when user is authenticated
  // This prevents flashing to 404 during navigation
  if (isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/projects" component={Projects} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/advertisers" component={Advertisers} />
        <Route path="/keywords" component={Keywords} />
        <Route path="/traffic-sources" component={TrafficSources} />
        <Route path="/meta-ads" component={MetaAds} />
        <Route path="/api" component={ApiPage} />
        <Route path="/privacy" component={Privacy} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Only show unauthenticated routes when definitely not authenticated
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/privacy" component={Privacy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
