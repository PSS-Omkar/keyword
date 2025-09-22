import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Plus, Upload, Layers, Edit, Trash2, Search, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateCampaignModal } from "@/components/CreateCampaignModal";
import { CreateCampaignGroupModal } from "@/components/CreateCampaignGroupModal";
import { EditCampaignGroupModal } from "@/components/EditCampaignGroupModal";
import { EditCampaignModal } from "@/components/EditCampaignModal";
import { BulkCampaignModal } from "@/components/BulkCampaignModal";
import { BulkCampaignGroupModal } from "@/components/BulkCampaignGroupModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Campaigns() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isEditCampaignModalOpen, setIsEditCampaignModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkGroupModalOpen, setIsBulkGroupModalOpen] = useState(false);
  const [selectedCampaignGroup, setSelectedCampaignGroup] = useState<any>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: number; status: string; type: 'campaign' | 'group' } | null>(null);

  // Fetch campaign groups
  const { data: campaignGroups } = useQuery({
    queryKey: ["/api/campaign-groups"],
    enabled: isAuthenticated,
  });

  // Fetch campaigns
  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated,
  });

  const queryClient = useQueryClient();

  // Filter campaign groups based on search term
  const filteredCampaignGroups = campaignGroups?.filter((group: any) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.trafficSource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns?.filter((campaign: any) =>
    campaign.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.trafficSource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.status.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Export campaign groups to Excel
  const exportCampaignGroupsToExcel = () => {
    if (!filteredCampaignGroups || filteredCampaignGroups.length === 0) {
      toast({
        title: "No Data",
        description: "No campaign groups to export",
        variant: "destructive",
      });
      return;
    }

    const data = filteredCampaignGroups.map((group: any) => ({
      ID: group.id,
      Name: group.name,
      "Traffic Source": group.trafficSource,
      Status: group.status,
      URL: group.url || "",
      "Channel ID": group.channelId || "",
      "AI Primary Text": group.aiPrimaryText || "",
      "AI Headline": group.aiHeadline || "",
      "AI CTA": group.aiCta || "",
      "AI Image": group.aiImage || "",
      "AI Video": group.aiVideo || "",
      "AI Variants": group.aiVariants || 1,
      "Primary Text": group.primaryText || "",
      "Headline": group.headline || "",
      "Description": group.description || "",
      "CTA": group.cta || "",
      "Image": group.image || "",
      "Video": group.video || "",
      "Created At": new Date(group.createdAt).toLocaleDateString(),
      "Updated At": new Date(group.updatedAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Campaign Groups");
    XLSX.writeFile(wb, `campaign_groups_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Export Successful",
      description: `Exported ${data.length} campaign groups to Excel`,
    });
  };

  // Export campaigns to Excel
  const exportCampaignsToExcel = () => {
    if (!filteredCampaigns || filteredCampaigns.length === 0) {
      toast({
        title: "No data to export",
        description: "Please add some campaigns before exporting.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for export
    const exportData = filteredCampaigns.map((campaign: any) => ({
      "Project": campaign.projectName || "Unknown",
      "Advertiser": campaign.advertiserName || "Unknown", 
      "Keyword": campaign.keyword,
      "Traffic Source": campaign.trafficSource,
      "Status": campaign.status,
      "URL": campaign.url || "",
      "Channel ID": campaign.channelId || "",
      "AI Primary Text": campaign.aiPrimaryText || "",
      "AI Headline": campaign.aiHeadline || "",
      "AI CTA": campaign.aiCta || "",
      "AI Image": campaign.aiImage || "",
      "AI Video": campaign.aiVideo || "",
      "Primary Text": campaign.primaryText || "",
      "Headline": campaign.headline || "",
      "Description": campaign.description || "",
      "CTA": campaign.cta || "",
      "Image": campaign.image || "",
      "Video": campaign.video || "",
      "Created Date": new Date(campaign.createdAt).toLocaleDateString(),
      "Updated Date": new Date(campaign.updatedAt).toLocaleDateString(),
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Project
      { wch: 20 }, // Advertiser
      { wch: 25 }, // Keyword
      { wch: 15 }, // Traffic Source
      { wch: 12 }, // Status
      { wch: 30 }, // URL
      { wch: 15 }, // Channel ID
      { wch: 40 }, // AI Primary Text
      { wch: 40 }, // AI Headline
      { wch: 40 }, // AI CTA
      { wch: 40 }, // AI Image
      { wch: 40 }, // AI Video
      { wch: 30 }, // Primary Text
      { wch: 20 }, // Headline
      { wch: 30 }, // Description
      { wch: 15 }, // CTA
      { wch: 30 }, // Image
      { wch: 30 }, // Video
      { wch: 15 }, // Created Date
      { wch: 15 }, // Updated Date
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Campaigns");

    // Generate filename with current date
    const now = new Date();
    const filename = `campaigns_export_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    toast({
      title: "Export successful", 
      description: `Downloaded ${exportData.length} campaigns to ${filename}`,
    });
  };

  // Update campaign group status mutation
  const updateCampaignGroupStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/campaign-groups/${id}`, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/campaign-groups"] });
      const previousGroups = queryClient.getQueryData(["/api/campaign-groups"]);
      
      queryClient.setQueryData(["/api/campaign-groups"], (old: any[]) => {
        return old?.map(group => 
          group.id === id ? { ...group, status } : group
        );
      });
      
      return { previousGroups };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["/api/campaign-groups"], context?.previousGroups);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-groups"] });
    },
  });

  // Update campaign status mutation
  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/campaigns/${id}`, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/campaigns"] });
      const previousCampaigns = queryClient.getQueryData(["/api/campaigns"]);
      
      queryClient.setQueryData(["/api/campaigns"], (old: any[]) => {
        return old?.map(campaign => 
          campaign.id === id ? { ...campaign, status } : campaign
        );
      });
      
      return { previousCampaigns };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["/api/campaigns"], context?.previousCampaigns);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
  });

  // Delete campaign group mutation
  const deleteCampaignGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/campaign-groups/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign group deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-groups"] });
      queryClient.refetchQueries({ queryKey: ["/api/campaign-groups"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete campaign group",
        variant: "destructive",
      });
    },
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
          <p className="mt-4 text-slate-600">Loading campaigns...</p>
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
              <h1 className="text-3xl font-bold text-slate-900">Campaigns</h1>
              <p className="text-slate-600 mt-1">Manage your advertising campaigns and campaign groups</p>
            </div>
          </div>
        </div>

        {/* Tabs for Campaigns and Campaign Groups */}
        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Individual Campaigns
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Campaign Groups
            </TabsTrigger>
          </TabsList>

          {/* Individual Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search campaigns by keyword, advertiser, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Bulk Upload
              </Button>
              <Button 
                variant="outline"
                onClick={exportCampaignsToExcel}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </Button>
            </div>

            {/* Individual Campaigns Content */}
            {filteredCampaigns && filteredCampaigns.length > 0 ? (
              <div className="space-y-4">
                {filteredCampaigns.map((campaign: any) => (
                  <Card key={campaign.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-slate-900 mb-2">{campaign.keyword}</h3>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>Project: {campaign.projectName || `Project ${campaign.projectId}`}</span>
                            <span>Advertiser: {campaign.advertiserName || `Advertiser ${campaign.advertiserId}`}</span>
                            <span>Traffic Source: {campaign.trafficSource}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Status:</span>
                              <Select
                                value={campaign.status}
                                onValueChange={(newStatus) => {
                                  if (newStatus === 'active') {
                                    setPendingStatusChange({ id: campaign.id, status: newStatus, type: 'campaign' });
                                    setConfirmationOpen(true);
                                  } else {
                                    updateCampaignStatusMutation.mutate({ id: campaign.id, status: newStatus });
                                  }
                                }}
                              >
                                <SelectTrigger className={`h-6 w-20 text-xs ${
                                  campaign.status === 'active' 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : campaign.status === 'draft' 
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="paused">Paused</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedCampaign(campaign);
                              setIsEditCampaignModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this campaign?")) {
                                // Add delete functionality later if needed
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Play className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No campaigns yet</h3>
                    <p className="text-slate-600 mb-6">Create your first individual campaign to get started.</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Campaign Groups Tab */}
          <TabsContent value="groups" className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search campaign groups by name, traffic source, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => {
                  console.log("Create Campaign Group button clicked");
                  setIsCreateGroupModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Layers className="h-4 w-4" />
                Create Campaign Group
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsBulkGroupModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Bulk Upload
              </Button>
              <Button 
                variant="outline"
                onClick={exportCampaignGroupsToExcel}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </Button>
            </div>

            {/* Campaign Groups Content */}
            {filteredCampaignGroups && filteredCampaignGroups.length > 0 ? (
              <div className="space-y-4">
                {filteredCampaignGroups.map((group: any) => (
                  <Card key={group.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-slate-900 mb-2">{group.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>Project: {group.projectName || `Project ${group.projectId}`}</span>
                            <span>Advertiser: {group.advertiserName || `Advertiser ${group.advertiserId}`}</span>
                            <span>Traffic Source: {group.trafficSource}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Status:</span>
                              <Select
                                value={group.status}
                                onValueChange={(newStatus) => {
                                  if (newStatus === 'active') {
                                    setPendingStatusChange({ id: group.id, status: newStatus, type: 'group' });
                                    setConfirmationOpen(true);
                                  } else {
                                    updateCampaignGroupStatusMutation.mutate({ id: group.id, status: newStatus });
                                  }
                                }}
                              >
                                <SelectTrigger className={`h-6 w-20 text-xs ${
                                  group.status === 'active' 
                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                    : group.status === 'draft' 
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                                    : 'bg-red-100 text-red-800 border-red-200'
                                }`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="paused">Paused</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedCampaignGroup(group);
                              setIsEditGroupModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this campaign group?")) {
                                deleteCampaignGroupMutation.mutate(group.id);
                              }
                            }}
                            disabled={deleteCampaignGroupMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Layers className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No campaign groups yet</h3>
                    <p className="text-slate-600 mb-6">
                      Create your first campaign group to automatically include all keywords from a project.
                    </p>
                    <Button onClick={() => {
                      console.log("Create First Campaign Group button clicked");
                      setIsCreateGroupModalOpen(true);
                    }}>
                      <Layers className="h-4 w-4 mr-2" />
                      Create First Campaign Group
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <CreateCampaignModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      
      <CreateCampaignGroupModal 
        isOpen={isCreateGroupModalOpen} 
        onClose={() => setIsCreateGroupModalOpen(false)} 
      />
      
      <EditCampaignGroupModal 
        isOpen={isEditGroupModalOpen} 
        onClose={() => setIsEditGroupModalOpen(false)} 
        campaignGroup={selectedCampaignGroup}
      />
      
      <EditCampaignModal 
        isOpen={isEditCampaignModalOpen} 
        onClose={() => setIsEditCampaignModalOpen(false)} 
        campaign={selectedCampaign}
      />
      
      <BulkCampaignModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
      />
      
      <BulkCampaignGroupModal 
        isOpen={isBulkGroupModalOpen} 
        onClose={() => setIsBulkGroupModalOpen(false)} 
      />

      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate {pendingStatusChange?.type === 'campaign' ? 'Campaign' : 'Campaign Group'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate this {pendingStatusChange?.type === 'campaign' ? 'campaign' : 'campaign group'}? This will make it live and start tracking performance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmationOpen(false);
              setPendingStatusChange(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingStatusChange) {
                if (pendingStatusChange.type === 'campaign') {
                  updateCampaignStatusMutation.mutate({ id: pendingStatusChange.id, status: pendingStatusChange.status });
                } else {
                  updateCampaignGroupStatusMutation.mutate({ id: pendingStatusChange.id, status: pendingStatusChange.status });
                }
              }
              setConfirmationOpen(false);
              setPendingStatusChange(null);
            }}>
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}