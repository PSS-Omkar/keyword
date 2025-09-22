import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BulkCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
}

export function BulkCampaignModal({ isOpen, onClose, projectId }: BulkCampaignModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(projectId);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", selectedProjectId?.toString() || "");

      const response = await fetch("/api/campaigns/bulk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      if (selectedProjectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProjectId, "campaigns"] });
      }
      toast({
        title: "Success",
        description: `Created ${data.created} campaigns successfully`,
      });
      handleClose();
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
        description: error.message || "Failed to create campaigns",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setUploadedFile(null);
    setSelectedProjectId(projectId);
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleUpload = () => {
    if (!uploadedFile) {
      toast({
        title: "Validation Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProjectId) {
      toast({
        title: "Validation Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }

    bulkCreateMutation.mutate(uploadedFile);
  };

  const downloadSampleFile = () => {
    const csvContent = `keyword,url,channelId,status,trafficSource,aiPrimaryText,aiHeadline,aiCta,aiImage,aiVideo,primaryText,headline,description,cta,image,video
gaming laptops,https://example.com/gaming-laptops,sedo_001,draft,Google,"Create engaging primary text for gaming laptops that highlights performance and value","Write a compelling headline for gaming laptop campaigns","Generate a strong CTA for gaming laptop purchases","Describe an image showing a powerful gaming laptop in action","Outline a video concept showcasing gaming laptop performance",High-performance gaming laptops,Best Gaming Laptops 2025,Premium gaming laptops for serious gamers,Shop Now,https://example.com/laptop.jpg,https://example.com/laptop-video.mp4
office chairs,https://example.com/office-chairs,sedo_002,active,Facebook,"Create engaging primary text for ergonomic office chairs focusing on comfort","Write a compelling headline for office furniture campaigns","Generate a strong CTA for office chair purchases","Describe an image showing a comfortable office workspace","Outline a video concept demonstrating chair ergonomics",Ergonomic office furniture,Comfortable Office Chairs,Ergonomic chairs for better productivity,Learn More,https://example.com/chair.jpg,
smart watches,https://example.com/smart-watches,sedo_003,draft,Instagram,"Create engaging primary text for smartwatches highlighting connectivity and features","Write a compelling headline for smartwatch campaigns","Generate a strong CTA for smartwatch purchases","Describe an image showing a modern smartwatch","Outline a video concept showcasing smartwatch features",Latest smartwatch technology,Smart Watches 2025,Stay connected with smart wearables,Buy Now,,https://example.com/watch-demo.mp4`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'campaign_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Create Campaigns</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">Upload a CSV file to create multiple campaigns at once.</p>
        
        <div className="space-y-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project</label>
            <Select 
              value={selectedProjectId?.toString()} 
              onValueChange={(value) => setSelectedProjectId(parseInt(value))}
              disabled={!!projectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sample File Download */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Download Sample File</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Download the CSV template with all available columns including optional fields
                </p>
                <Button onClick={downloadSampleFile} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Campaign File</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Upload a CSV file with your campaign data
                </p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select File
                  </Button>
                  
                  {uploadedFile && (
                    <div className="text-sm text-slate-600">
                      Selected: {uploadedFile.name}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">File Format Requirements</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Required columns: keyword, url, channelId, status</li>
              <li>• Optional columns: trafficSource, primaryText, headline, description, cta, image, video</li>
              <li>• Status options: draft, active, paused</li>
              <li>• Channel IDs must match those available for the selected project's advertiser</li>
              <li>• URLs should be valid and include the protocol (https://)</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={bulkCreateMutation.isPending || !uploadedFile || !selectedProjectId}
            >
              {bulkCreateMutation.isPending ? (
                "Creating..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaigns
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}