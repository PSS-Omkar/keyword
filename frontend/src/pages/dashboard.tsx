import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { NavigationHeader } from "@/components/NavigationHeader";
import { StatsCards } from "@/components/StatsCards";
import { ProjectsTable } from "@/components/ProjectsTable";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Initialize default advertisers
  useEffect(() => {
    const initializeData = async () => {
      try {
        await apiRequest("POST", "/api/init");
      } catch (error) {
        console.error("Failed to initialize data:", error);
      }
    };
    
    if (isAuthenticated) {
      initializeData();
    }
  }, [isAuthenticated]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Dashboard Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Project Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">Manage your advertising projects and campaigns</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Projects Table */}
        <ProjectsTable />
      </div>
    </div>
  );
}
