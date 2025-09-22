import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Trash2, Plus, Target, DollarSign, Globe, X, Edit, ChevronDown, Play, Pause, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Countries list for location targeting
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "GR", name: "Greece" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "EE", name: "Estonia" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "MY", name: "Malaysia" },
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "VN", name: "Vietnam" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "PE", name: "Peru" },
  { code: "VE", name: "Venezuela" },
  { code: "ZA", name: "South Africa" },
  { code: "EG", name: "Egypt" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "MA", name: "Morocco" },
  { code: "IL", name: "Israel" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "TR", name: "Turkey" },
  { code: "RU", name: "Russia" },
  { code: "UA", name: "Ukraine" },
  { code: "BY", name: "Belarus" },
  { code: "RS", name: "Serbia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "MK", name: "North Macedonia" },
  { code: "AL", name: "Albania" },
  { code: "ME", name: "Montenegro" },
  { code: "XK", name: "Kosovo" },
  { code: "IS", name: "Iceland" },
  { code: "MT", name: "Malta" },
  { code: "CY", name: "Cyprus" },
  { code: "LU", name: "Luxembourg" },
  { code: "MC", name: "Monaco" },
  { code: "AD", name: "Andorra" },
  { code: "SM", name: "San Marino" },
  { code: "VA", name: "Vatican City" },
  { code: "LI", name: "Liechtenstein" },
];

// Languages list for language targeting
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "tl", name: "Filipino" },
  { code: "nl", name: "Dutch" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" },
  { code: "pl", name: "Polish" },
  { code: "cs", name: "Czech" },
  { code: "hu", name: "Hungarian" },
  { code: "ro", name: "Romanian" },
  { code: "bg", name: "Bulgarian" },
  { code: "hr", name: "Croatian" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "et", name: "Estonian" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "el", name: "Greek" },
  { code: "tr", name: "Turkish" },
  { code: "he", name: "Hebrew" },
  { code: "fa", name: "Persian" },
  { code: "ur", name: "Urdu" },
  { code: "bn", name: "Bengali" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "as", name: "Assamese" },
  { code: "uk", name: "Ukrainian" },
  { code: "be", name: "Belarusian" },
  { code: "ka", name: "Georgian" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "kk", name: "Kazakh" },
  { code: "ky", name: "Kyrgyz" },
  { code: "uz", name: "Uzbek" },
  { code: "tg", name: "Tajik" },
  { code: "mn", name: "Mongolian" },
];

interface MetaCampaignConfig {
  id: string;
  selectedCampaigns: number[];
  selectedCampaignGroups: number[];
  campaignName: string;
  campaignNameStructure: string;
  advertiserId: number;
  adAccount: string;
  adAccountUser: string;
  locationTargeting: string[];
  language: string[];
  campaignBudget: number;
  campaignBid: number;
  pixel: string;
  conversionEvent: string;
  adFormat: string;
  objective: string;
  goal: string;
  biddingStrategy: string;
  placementType: string;
  finalUrl: string;
  campaignSuffix: string;
  urlExtraParameters: string;
}

export default function MetaAds() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [configs, setConfigs] = useState<MetaCampaignConfig[]>([]);
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
  const [selectedCampaignGroups, setSelectedCampaignGroups] = useState<number[]>([]);
  const [campaignSearchTerm, setCampaignSearchTerm] = useState("");
  const [campaignGroupSearchTerm, setCampaignGroupSearchTerm] = useState("");
  const [metaCampaignSearchTerm, setMetaCampaignSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);

  // Fetch campaigns and campaign groups
  const { data: campaigns } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated,
  });

  const { data: campaignGroups } = useQuery({
    queryKey: ["/api/campaign-groups"],
    enabled: isAuthenticated,
  });

  const { data: advertisers } = useQuery({
    queryKey: ["/api/advertisers"],
    enabled: isAuthenticated,
  });

  // Fetch existing meta campaigns
  const { data: metaCampaigns, refetch: refetchMetaCampaigns } = useQuery({
    queryKey: ["/api/meta-campaigns"],
    enabled: isAuthenticated,
  });

  // Meta Ads API data
  const { data: metaAdAccounts } = useQuery({
    queryKey: ["/api/meta/ad-accounts"],
    enabled: isAuthenticated,
  });

  const { data: metaPixels } = useQuery({
    queryKey: ["/api/meta/pixels"],
    enabled: isAuthenticated,
  });

  const { data: metaConversionEvents } = useQuery({
    queryKey: ["/api/meta/conversion-events"],
    enabled: isAuthenticated,
  });

  const { data: adAccountUsers } = useQuery({
    queryKey: ["/api/meta/ad-account-users"],
    enabled: isAuthenticated,
  });

  // Filter campaigns and campaign groups
  const filteredCampaigns = campaigns?.filter((campaign: any) =>
    campaign.keyword?.toLowerCase().includes(campaignSearchTerm.toLowerCase()) ||
    campaign.trafficSource?.toLowerCase().includes(campaignSearchTerm.toLowerCase())
  );

  const filteredCampaignGroups = campaignGroups?.filter((group: any) =>
    group.name?.toLowerCase().includes(campaignGroupSearchTerm.toLowerCase()) ||
    group.trafficSource?.toLowerCase().includes(campaignGroupSearchTerm.toLowerCase())
  );

  // Filter meta campaigns based on search term
  const filteredMetaCampaigns = metaCampaigns?.filter((metaCampaign: any) =>
    metaCampaign.name?.toLowerCase().includes(metaCampaignSearchTerm.toLowerCase()) ||
    metaCampaign.objective?.toLowerCase().includes(metaCampaignSearchTerm.toLowerCase()) ||
    metaCampaign.status?.toLowerCase().includes(metaCampaignSearchTerm.toLowerCase())
  );

  // Delete meta campaign mutation
  const deleteMetaCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/meta-campaigns/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Meta Campaign Deleted",
        description: "Meta campaign deleted successfully",
      });
      refetchMetaCampaigns();
    },
    onError: (error) => {
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
        description: "Failed to delete meta campaign",
        variant: "destructive",
      });
    },
  });

  // Toggle meta campaign status mutation
  const toggleMetaCampaignStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: number; newStatus: string }) => {
      return apiRequest("PATCH", `/api/meta-campaigns/${id}`, {
        status: newStatus,
      });
    },
    onSuccess: (_, { newStatus }) => {
      toast({
        title: "Status Updated",
        description: `Meta campaign ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
      refetchMetaCampaigns();
    },
    onError: (error) => {
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
        description: "Failed to update campaign status",
        variant: "destructive",
      });
    },
  });

  // Create meta campaign configurations mutation
  const createMetaCampaignsMutation = useMutation({
    mutationFn: async (campaignConfigs: MetaCampaignConfig[]) => {
      return apiRequest("POST", "/api/meta/campaigns", { configs: campaignConfigs });
    },
    onSuccess: (data) => {
      toast({
        title: "Meta Campaigns Created",
        description: data.message || "Campaigns created successfully",
      });
      setConfigs([]);
      setSelectedCampaigns([]);
      setSelectedCampaignGroups([]);
      setIsCreateModalOpen(false);
      refetchMetaCampaigns();
    },
    onError: (error) => {
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
        description: "Failed to create Meta campaigns",
        variant: "destructive",
      });
    },
  });

  // Update meta campaign mutation
  const updateMetaCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      return apiRequest("PATCH", `/api/meta-campaigns/${campaignData.id}`, campaignData);
    },
    onSuccess: () => {
      toast({
        title: "Meta Campaign Updated",
        description: "Campaign updated successfully",
      });
      setEditingCampaign(null);
      refetchMetaCampaigns();
    },
    onError: (error) => {
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
        description: "Failed to update Meta campaign",
        variant: "destructive",
      });
    },
  });

  // Helper function to get selected advertiser
  const getSelectedAdvertiser = (config: MetaCampaignConfig) => {
    return config.advertiserId;
  };

  // Create new configuration
  const createNewConfig = () => {
    if (selectedCampaigns.length === 0 && selectedCampaignGroups.length === 0) return;
    
    // Get advertiser from selected campaigns or campaign groups
    let advertiserId = 0;
    if (selectedCampaigns.length > 0) {
      const firstCampaign = campaigns?.find((c: any) => c.id === selectedCampaigns[0]);
      advertiserId = firstCampaign?.advertiserId || 0;
    } else if (selectedCampaignGroups.length > 0) {
      const firstGroup = campaignGroups?.find((g: any) => g.id === selectedCampaignGroups[0]);
      advertiserId = firstGroup?.advertiserId || 0;
    }

    const newConfig: MetaCampaignConfig = {
      id: Date.now().toString(),
      selectedCampaigns: [...selectedCampaigns],
      selectedCampaignGroups: [...selectedCampaignGroups],
      campaignName: "[advertiser_id]_[ad_account_user]_[country_code]_[language_code]_[keyword]",
      campaignNameStructure: "[advertiser_id]_[ad_account_user]_[country_code]_[language_code]_[keyword]",
      advertiserId,
      adAccount: "",
      adAccountUser: "",
      locationTargeting: ["US"], // Default to United States
      language: ["en"], // Default to English
      campaignBudget: 100,
      campaignBid: 1.0,
      pixel: "",
      conversionEvent: "",
      adFormat: "single_image",
      objective: "conversions",
      goal: "maximize_conversions",
      biddingStrategy: "lowest_cost",
      placementType: "automatic_placements",
      finalUrl: "",
      campaignSuffix: "",
      urlExtraParameters: "",
    };

    setConfigs([...configs, newConfig]);
  };

  // Update configuration
  const updateConfig = (id: string, field: keyof MetaCampaignConfig, value: any) => {
    setConfigs(configs.map(config => 
      config.id === id ? { ...config, [field]: value } : config
    ));
  };

  // Generate preview of campaign name with variables replaced
  const generateCampaignNamePreview = (config: MetaCampaignConfig) => {
    let preview = config.campaignName || config.campaignNameStructure;
    
    // Replace variables with actual values or placeholders
    const selectedAdvertiser = getSelectedAdvertiser(config);
    const advertiserId = selectedAdvertiser?.id || 'advertiser_id';
    const adAccountUser = config.adAccountUser || 'ad_account_user';
    const countryCode = config.locationTargeting[0] || 'country_code';
    const languageCode = config.language[0] || 'language_code';
    const channelId = selectedAdvertiser?.channelIds?.[0] || 'channel_id';
    
    preview = preview
      .replace(/\[advertiser_id\]/g, advertiserId.toString())
      .replace(/\[ad_account_user\]/g, adAccountUser)
      .replace(/\[country_code\]/g, countryCode)
      .replace(/\[language_code\]/g, languageCode)
      .replace(/\[channel_id\]/g, channelId)
      .replace(/\[keyword\]/g, 'sample_keyword');
    
    return preview;
  };

  // Duplicate configuration
  const duplicateConfig = (config: MetaCampaignConfig) => {
    const duplicated = {
      ...config,
      id: Date.now().toString(),
    };
    setConfigs([...configs, duplicated]);
  };

  // Delete configuration
  const deleteConfig = (id: string) => {
    setConfigs(configs.filter(config => config.id !== id));
  };

  // Handle campaign creation
  const handleCreateCampaigns = () => {
    if (configs.length === 0) return;
    createMetaCampaignsMutation.mutate(configs);
  };

  // Handle unauthorized access
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
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Meta Ads Campaigns</h1>
              <p className="text-slate-600 mt-1">Manage your Meta advertising campaign configurations</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Meta Campaign
            </Button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6">
          <Input
            placeholder="Search meta campaigns by name, objective, or status..."
            value={metaCampaignSearchTerm}
            onChange={(e) => setMetaCampaignSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Meta Campaigns List */}
        <div className="space-y-4">
          {filteredMetaCampaigns?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Meta Campaigns</h3>
                <p className="text-slate-500 text-center mb-4">
                  {metaCampaignSearchTerm ? 
                    "No campaigns match your search criteria." : 
                    "You haven't created any Meta ad campaigns yet. Create your first campaign to get started."
                  }
                </p>
                {!metaCampaignSearchTerm && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Meta Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredMetaCampaigns?.map((metaCampaign: any) => (
              <Card key={metaCampaign.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{metaCampaign.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ 
                          metaCampaign.status === 'active' ? 'bg-green-100 text-green-700' :
                          metaCampaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {metaCampaign.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Objective:</span>
                          <p className="font-medium">{metaCampaign.objective}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Budget:</span>
                          <p className="font-medium">${metaCampaign.campaignBudget}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Bid:</span>
                          <p className="font-medium">${metaCampaign.campaignBid}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Ad Account:</span>
                          <p className="font-medium">{metaCampaign.adAccount}</p>
                        </div>
                      </div>

                      {metaCampaign.locationTargeting && metaCampaign.locationTargeting.length > 0 && (
                        <div className="mt-3">
                          <span className="text-slate-500 text-sm">Targeting:</span>
                          <p className="text-sm">{metaCampaign.locationTargeting.join(', ')} | {metaCampaign.language?.join(', ')}</p>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-slate-500">
                        Created: {new Date(metaCampaign.createdAt).toLocaleDateString()}
                        {metaCampaign.metaCampaignId && (
                          <span className="ml-4">Meta ID: {metaCampaign.metaCampaignId}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingCampaign(metaCampaign)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {/* Status Toggle Button */}
                      {metaCampaign.status === 'draft' ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              disabled={toggleMetaCampaignStatusMutation.isPending}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Activate Meta Campaign
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to activate this Meta campaign? Once activated, it will start running and consuming budget.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => 
                                  toggleMetaCampaignStatusMutation.mutate({
                                    id: metaCampaign.id,
                                    newStatus: 'active'
                                  })
                                }
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Activate Campaign
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-yellow-600 hover:text-yellow-700"
                          onClick={() => 
                            toggleMetaCampaignStatusMutation.mutate({
                              id: metaCampaign.id,
                              newStatus: 'draft'
                            })
                          }
                          disabled={toggleMetaCampaignStatusMutation.isPending}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => deleteMetaCampaignMutation.mutate(metaCampaign.id)}
                        disabled={deleteMetaCampaignMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Meta Campaign Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Create Meta Campaign</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setConfigs([]);
                      setSelectedCampaigns([]);
                      setSelectedCampaignGroups([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Campaign/Campaign Group Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Select Campaigns or Campaign Groups
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Individual Campaigns Selection */}
                    <div>
                      <Label className="text-base font-medium">Individual Campaigns</Label>
                      <div className="mt-2 mb-3">
                        <Input
                          placeholder="Search campaigns..."
                          value={campaignSearchTerm}
                          onChange={(e) => setCampaignSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {filteredCampaigns?.map((campaign: any) => (
                          <div key={campaign.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`campaign-${campaign.id}`}
                              checked={selectedCampaigns.includes(campaign.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCampaigns([...selectedCampaigns, campaign.id]);
                                } else {
                                  setSelectedCampaigns(selectedCampaigns.filter(id => id !== campaign.id));
                                }
                              }}
                            />
                            <label htmlFor={`campaign-${campaign.id}`} className="text-sm">
                              {campaign.keyword} - {campaign.trafficSource} ({campaign.status})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Campaign Groups Selection */}
                    <div>
                      <Label className="text-base font-medium">Campaign Groups</Label>
                      <div className="mt-2 mb-3">
                        <Input
                          placeholder="Search campaign groups..."
                          value={campaignGroupSearchTerm}
                          onChange={(e) => setCampaignGroupSearchTerm(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {filteredCampaignGroups?.map((group: any) => (
                          <div key={group.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`group-${group.id}`}
                              checked={selectedCampaignGroups.includes(group.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCampaignGroups([...selectedCampaignGroups, group.id]);
                                } else {
                                  setSelectedCampaignGroups(selectedCampaignGroups.filter(id => id !== group.id));
                                }
                              }}
                            />
                            <label htmlFor={`group-${group.id}`} className="text-sm">
                              {group.name} - {group.trafficSource} ({group.status})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={createNewConfig}
                      disabled={selectedCampaigns.length === 0 && selectedCampaignGroups.length === 0}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Meta Campaign Configuration
                    </Button>
                  </CardContent>
                </Card>

                {/* Configuration Forms */}
                <div className="space-y-6">
                  {configs.map((config) => (
                    <Card key={config.id} className="border-2 border-blue-200">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Meta Campaign Configuration
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateConfig(config)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteConfig(config.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {/* Campaign Name/Structure */}
                          <div className="lg:col-span-3">
                            {(config.selectedCampaigns.length + config.selectedCampaignGroups.length) === 1 ? (
                              <div>
                                <Label htmlFor={`campaign-name-${config.id}`}>Campaign Name</Label>
                                <Input
                                  id={`campaign-name-${config.id}`}
                                  value={config.campaignName}
                                  onChange={(e) => updateConfig(config.id, 'campaignName', e.target.value)}
                                  placeholder="[advertiser_id]_[ad_account_user]_[country_code]_[language_code]_[keyword]"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                  Available variables: [advertiser_id], [ad_account_user], [country_code], [language_code], [keyword], [channel_id]
                                </p>
                                <div className="mt-2 p-2 bg-blue-50 rounded border">
                                  <p className="text-xs text-blue-600 font-medium">Preview:</p>
                                  <p className="text-sm text-blue-800">{generateCampaignNamePreview(config)}</p>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <Label htmlFor={`campaign-structure-${config.id}`}>Campaign Name Structure</Label>
                                <Input
                                  id={`campaign-structure-${config.id}`}
                                  value={config.campaignNameStructure}
                                  onChange={(e) => updateConfig(config.id, 'campaignNameStructure', e.target.value)}
                                  placeholder="[advertiser_id]_[ad_account_user]_[country_code]_[language_code]_[keyword]"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                  Available variables: [advertiser_id], [ad_account_user], [country_code], [language_code], [keyword], [channel_id]
                                </p>
                                <div className="mt-2 p-2 bg-blue-50 rounded border">
                                  <p className="text-xs text-blue-600 font-medium">Preview:</p>
                                  <p className="text-sm text-blue-800">{generateCampaignNamePreview(config)}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Advertiser (Pre-selected) */}
                          <div>
                            <Label>Advertiser</Label>
                            <Select
                              value={getSelectedAdvertiser(config)?.toString() || ""}
                              disabled
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Auto-selected from campaigns" />
                              </SelectTrigger>
                              <SelectContent>
                                {advertisers?.map((advertiser: any) => (
                                  <SelectItem key={advertiser.id} value={advertiser.id.toString()}>
                                    {advertiser.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Ad Account */}
                          <div>
                            <Label>Ad Account</Label>
                            <Select
                              value={config.adAccount}
                              onValueChange={(value) => updateConfig(config.id, 'adAccount', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select ad account" />
                              </SelectTrigger>
                              <SelectContent>
                                {metaAdAccounts?.map((account: any) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Ad Account User */}
                          <div>
                            <Label>Ad Account User</Label>
                            <Select
                              value={config.adAccountUser}
                              onValueChange={(value) => updateConfig(config.id, 'adAccountUser', value)}
                              disabled={!config.adAccount}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={config.adAccount ? "Select user" : "Select ad account first"} />
                              </SelectTrigger>
                              <SelectContent>
                                {adAccountUsers?.map((user: any) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Location Targeting */}
                          <div>
                            <Label>Location Targeting</Label>
                            <Select
                              value={config.locationTargeting[0] || "US"}
                              onValueChange={(value) => updateConfig(config.id, 'locationTargeting', [value])}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {COUNTRIES.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Language */}
                          <div>
                            <Label>Language</Label>
                            <Select
                              value={config.language[0] || "en"}
                              onValueChange={(value) => updateConfig(config.id, 'language', [value])}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {LANGUAGES.map((language) => (
                                  <SelectItem key={language.code} value={language.code}>
                                    {language.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Campaign Budget */}
                          <div>
                            <Label>Campaign Budget ($)</Label>
                            <Input
                              type="number"
                              value={config.campaignBudget}
                              onChange={(e) => updateConfig(config.id, 'campaignBudget', parseFloat(e.target.value))}
                              min="1"
                            />
                          </div>

                          {/* Campaign Bid */}
                          <div>
                            <Label>Campaign Bid ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={config.campaignBid}
                              onChange={(e) => updateConfig(config.id, 'campaignBid', parseFloat(e.target.value))}
                              min="0.01"
                            />
                          </div>

                          {/* Pixel */}
                          <div>
                            <Label>Pixel</Label>
                            <Select
                              value={config.pixel}
                              onValueChange={(value) => updateConfig(config.id, 'pixel', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select pixel" />
                              </SelectTrigger>
                              <SelectContent>
                                {metaPixels?.map((pixel: any) => (
                                  <SelectItem key={pixel.id} value={pixel.id}>
                                    {pixel.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Conversion Event */}
                          <div>
                            <Label>Conversion Event</Label>
                            <Select
                              value={config.conversionEvent}
                              onValueChange={(value) => updateConfig(config.id, 'conversionEvent', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select conversion event" />
                              </SelectTrigger>
                              <SelectContent>
                                {metaConversionEvents?.map((event: any) => (
                                  <SelectItem key={event.id} value={event.id}>
                                    {event.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Ad Format */}
                          <div>
                            <Label>Ad Format</Label>
                            <Select
                              value={config.adFormat}
                              onValueChange={(value) => updateConfig(config.id, 'adFormat', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single_image">Single Image</SelectItem>
                                <SelectItem value="carousel">Carousel</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="collection">Collection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Objective */}
                          <div>
                            <Label>Objective</Label>
                            <Select
                              value={config.objective}
                              onValueChange={(value) => updateConfig(config.id, 'objective', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="conversions">Conversions</SelectItem>
                                <SelectItem value="link_clicks">Link Clicks</SelectItem>
                                <SelectItem value="reach">Reach</SelectItem>
                                <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                                <SelectItem value="video_views">Video Views</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Goal */}
                          <div>
                            <Label>Goal</Label>
                            <Select
                              value={config.goal}
                              onValueChange={(value) => updateConfig(config.id, 'goal', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="maximize_conversions">Maximize Conversions</SelectItem>
                                <SelectItem value="maximize_clicks">Maximize Clicks</SelectItem>
                                <SelectItem value="maximize_reach">Maximize Reach</SelectItem>
                                <SelectItem value="target_cpa">Target CPA</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Bidding Strategy */}
                          <div>
                            <Label>Bidding Strategy</Label>
                            <Select
                              value={config.biddingStrategy}
                              onValueChange={(value) => updateConfig(config.id, 'biddingStrategy', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lowest_cost">Lowest Cost</SelectItem>
                                <SelectItem value="cost_cap">Cost Cap</SelectItem>
                                <SelectItem value="bid_cap">Bid Cap</SelectItem>
                                <SelectItem value="target_cost">Target Cost</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Placement Type */}
                          <div>
                            <Label>Placement Type</Label>
                            <Select
                              value={config.placementType}
                              onValueChange={(value) => updateConfig(config.id, 'placementType', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="automatic_placements">Automatic Placements</SelectItem>
                                <SelectItem value="manual_placements">Manual Placements</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Final URL */}
                          <div className="lg:col-span-2">
                            <Label>Final URL</Label>
                            <Input
                              value={config.finalUrl}
                              onChange={(e) => updateConfig(config.id, 'finalUrl', e.target.value)}
                              placeholder="https://example.com/landing-page"
                            />
                          </div>

                          {/* Campaign Suffix */}
                          <div>
                            <Label>Campaign Suffix</Label>
                            <Input
                              value={config.campaignSuffix}
                              onChange={(e) => updateConfig(config.id, 'campaignSuffix', e.target.value)}
                              placeholder="utm_campaign=meta"
                            />
                          </div>

                          {/* URL Extra Parameters */}
                          <div className="lg:col-span-3">
                            <Label>URL Extra Parameters</Label>
                            <Textarea
                              value={config.urlExtraParameters}
                              onChange={(e) => updateConfig(config.id, 'urlExtraParameters', e.target.value)}
                              placeholder="utm_medium=social&utm_source=facebook"
                              rows={2}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                {configs.length > 0 && (
                  <div className="flex justify-center pt-6 border-t">
                    <Button 
                      size="lg" 
                      className="px-8"
                      onClick={handleCreateCampaigns}
                      disabled={createMetaCampaignsMutation.isPending}
                    >
                      <Globe className="h-5 w-5 mr-2" />
                      {createMetaCampaignsMutation.isPending ? "Creating..." : "Create Meta Campaigns"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Meta Campaign Modal */}
        {editingCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Edit Meta Campaign</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingCampaign(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Campaign Name */}
                  <div className="lg:col-span-3">
                    <Label htmlFor="edit-campaign-name">Campaign Name</Label>
                    <Input
                      id="edit-campaign-name"
                      value={editingCampaign.name || ""}
                      onChange={(e) => setEditingCampaign({...editingCampaign, name: e.target.value})}
                      placeholder="[advertiser_id]_[ad_account_user]_[country_code]_[language_code]_[keyword]"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Available variables: [advertiser_id], [ad_account_user], [country_code], [language_code], [keyword], [channel_id]
                    </p>
                    <div className="mt-2 p-2 bg-blue-50 rounded border">
                      <p className="text-xs text-blue-600 font-medium">Preview:</p>
                      <p className="text-sm text-blue-800">
                        {editingCampaign.name ? 
                          editingCampaign.name
                            .replace(/\[advertiser_id\]/g, editingCampaign.advertiserId || 'advertiser_id')
                            .replace(/\[ad_account_user\]/g, editingCampaign.adAccountUser || 'ad_account_user')
                            .replace(/\[country_code\]/g, editingCampaign.locationTargeting?.[0] || 'country_code')
                            .replace(/\[language_code\]/g, editingCampaign.language?.[0] || 'language_code')
                            .replace(/\[channel_id\]/g, 'channel_id')
                            .replace(/\[keyword\]/g, 'sample_keyword')
                          : 'Enter campaign name structure'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Ad Account */}
                  <div>
                    <Label>Ad Account</Label>
                    <Select
                      value={editingCampaign.adAccount || ""}
                      onValueChange={(value) => setEditingCampaign({...editingCampaign, adAccount: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ad account" />
                      </SelectTrigger>
                      <SelectContent>
                        {metaAdAccounts?.map((account: any) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ad Account User */}
                  <div>
                    <Label>Ad Account User</Label>
                    <Select
                      value={editingCampaign.adAccountUser || ""}
                      onValueChange={(value) => setEditingCampaign({...editingCampaign, adAccountUser: value})}
                      disabled={!editingCampaign.adAccount}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={editingCampaign.adAccount ? "Select user" : "Select ad account first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {adAccountUsers?.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Targeting */}
                  <div>
                    <Label>Location Targeting</Label>
                    <Select
                      value={editingCampaign.locationTargeting?.[0] || "US"}
                      onValueChange={(value) => setEditingCampaign({...editingCampaign, locationTargeting: [value]})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language */}
                  <div>
                    <Label>Language</Label>
                    <Select
                      value={editingCampaign.language?.[0] || "en"}
                      onValueChange={(value) => setEditingCampaign({...editingCampaign, language: [value]})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {LANGUAGES.map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            {language.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campaign Budget */}
                  <div>
                    <Label>Campaign Budget ($)</Label>
                    <Input
                      type="number"
                      value={editingCampaign.campaignBudget || 100}
                      onChange={(e) => setEditingCampaign({...editingCampaign, campaignBudget: parseFloat(e.target.value)})}
                      min="1"
                    />
                  </div>

                  {/* Campaign Bid */}
                  <div>
                    <Label>Campaign Bid ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingCampaign.campaignBid || 1.0}
                      onChange={(e) => setEditingCampaign({...editingCampaign, campaignBid: parseFloat(e.target.value)})}
                      min="0.01"
                    />
                  </div>

                  {/* Pixel */}
                  <div>
                    <Label>Pixel</Label>
                    <Select
                      value={editingCampaign.pixel || ""}
                      onValueChange={(value) => setEditingCampaign({...editingCampaign, pixel: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pixel" />
                      </SelectTrigger>
                      <SelectContent>
                        {metaPixels?.map((pixel: any) => (
                          <SelectItem key={pixel.id} value={pixel.id}>
                            {pixel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conversion Event */}
                  <div>
                    <Label>Conversion Event</Label>
                    <Select
                      value={editingCampaign.conversionEvent || ""}
                      onValueChange={(value) => setEditingCampaign({...editingCampaign, conversionEvent: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select conversion event" />
                      </SelectTrigger>
                      <SelectContent>
                        {metaConversionEvents?.map((event: any) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Objective */}
                  <div>
                    <Label>Objective</Label>
                    <Select
                      value={editingCampaign.objective || "conversions"}
                      onValueChange={(value) => setEditingCampaign({...editingCampaign, objective: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conversions">Conversions</SelectItem>
                        <SelectItem value="link_clicks">Link Clicks</SelectItem>
                        <SelectItem value="reach">Reach</SelectItem>
                        <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                        <SelectItem value="video_views">Video Views</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Goal */}
                  <div>
                    <Label>Goal</Label>
                    <Select
                      value={editingCampaign.goal || "maximize_conversions"}
                      onValueChange={(value) => setEditingCampaign({...editingCampaign, goal: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maximize_conversions">Maximize Conversions</SelectItem>
                        <SelectItem value="maximize_clicks">Maximize Clicks</SelectItem>
                        <SelectItem value="maximize_reach">Maximize Reach</SelectItem>
                        <SelectItem value="target_cpa">Target CPA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bidding Strategy */}
                  <div>
                    <Label>Bidding Strategy</Label>
                    <Select
                      value={editingCampaign.biddingStrategy || "lowest_cost"}
                      onValueChange={(value) => setEditingCampaign({...editingCampaign, biddingStrategy: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lowest_cost">Lowest Cost</SelectItem>
                        <SelectItem value="cost_cap">Cost Cap</SelectItem>
                        <SelectItem value="bid_cap">Bid Cap</SelectItem>
                        <SelectItem value="target_cost">Target Cost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Final URL */}
                  <div className="lg:col-span-2">
                    <Label>Final URL</Label>
                    <Input
                      value={editingCampaign.finalUrl || ""}
                      onChange={(e) => setEditingCampaign({...editingCampaign, finalUrl: e.target.value})}
                      placeholder="https://example.com/landing-page"
                    />
                  </div>

                  {/* Campaign Suffix */}
                  <div>
                    <Label>Campaign Suffix</Label>
                    <Input
                      value={editingCampaign.campaignSuffix || ""}
                      onChange={(e) => setEditingCampaign({...editingCampaign, campaignSuffix: e.target.value})}
                      placeholder="utm_campaign=meta"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setEditingCampaign(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => updateMetaCampaignMutation.mutate(editingCampaign)}
                    disabled={updateMetaCampaignMutation.isPending}
                  >
                    {updateMetaCampaignMutation.isPending ? "Updating..." : "Update Campaign"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}