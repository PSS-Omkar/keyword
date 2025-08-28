import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Globe, Link, Plus, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateAdvertiserModal } from "@/components/CreateAdvertiserModal";
import { EditAdvertiserModal } from "@/components/EditAdvertiserModal";

export default function Advertisers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<any>(null);

  const { data: advertisers, isLoading: advertisersLoading } = useQuery({
    queryKey: ["/api/advertisers"],
  });

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
          <p className="mt-4 text-slate-600">Loading advertisers...</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Advertisers</h1>
              <p className="mt-1 text-sm text-slate-600">Manage advertising partners</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Advertiser
            </Button>
          </div>
        </div>

        {/* Advertisers Grid */}
        {advertisersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="shadow-sm border border-slate-200">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advertisers?.map((advertiser: any) => (
              <Card key={advertiser.id} className="shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-slate-900">{advertiser.name}</h3>
                        <p className="text-sm text-slate-500">ID: {advertiser.id}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedAdvertiser(advertiser);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Channel IDs */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Globe className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="text-sm font-medium text-slate-700">Channel IDs</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {advertiser.channelIds?.slice(0, 3).map((channelId: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {channelId}
                        </Badge>
                      ))}
                      {advertiser.channelIds?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{advertiser.channelIds.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Domains */}
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Globe className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="text-sm font-medium text-slate-700">Domains</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {advertiser.domains?.slice(0, 2).map((domain: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {domain}
                        </Badge>
                      ))}
                      {advertiser.domains?.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{advertiser.domains.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Sample URL */}
                  {advertiser.sampleUrl && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Link className="h-4 w-4 text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-700">Sample URL</span>
                      </div>
                      <a
                        href={advertiser.sampleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:text-primary/80 break-all"
                      >
                        {advertiser.sampleUrl}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!advertisersLoading && (!advertisers || advertisers.length === 0) && (
          <Card className="shadow-sm border border-slate-200">
            <CardContent className="p-12 text-center">
              <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Advertisers Found</h3>
              <p className="text-slate-600">
                No advertising partners are currently available.
              </p>
            </CardContent>
          </Card>
        )}
        
        <CreateAdvertiserModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
        />
        
        <EditAdvertiserModal 
          isOpen={isEditModalOpen} 
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAdvertiser(null);
          }}
          advertiser={selectedAdvertiser}
        />
      </div>
    </div>
  );
}