import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface BulkCampaignGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulkCampaignGroupModal({ isOpen, onClose }: BulkCampaignGroupModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects for selection
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/campaign-groups/bulk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Created ${data.created} out of ${data.total} campaign groups`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-groups"] });
      onClose();
      setFile(null);
      setSelectedProject("");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !selectedProject) {
      toast({
        title: "Missing Information",
        description: "Please select a project and choose a file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", selectedProject);

    uploadMutation.mutate(formData);
  };

  const downloadTemplate = () => {
    const csvContent = `name,trafficSource,status,url,channelId,aiPrimaryText,aiHeadline,aiCta,aiImage,aiVideo,aiVariants,primaryText,headline,description,cta,image,video
"Social Media Campaign Group","facebook","draft","https://example.com","channel_001","Create engaging social media content that drives brand awareness and user engagement","Discover Amazing Products - Limited Time Offer","Shop Now","High-quality product showcase image with vibrant colors and clear branding","30-second video highlighting key product features and benefits","3","Discover our premium collection with exclusive deals","Amazing Products Available Now","Transform your lifestyle with our innovative solutions","Shop Today","https://example.com/image.jpg","https://example.com/video.mp4"
"Search Campaign Group","google","active","https://example.com","channel_002","Develop search-optimized content that captures high-intent users and drives conversions","Best Solutions for Your Needs - Expert Recommended","Learn More","Professional service demonstration with clear value proposition","Educational video explaining product benefits and use cases","2","Find the perfect solution for your specific needs","Expert Solutions Available","Get professional-grade results with our proven methodology","Get Started","https://example.com/search-image.jpg","https://example.com/demo-video.mp4"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign_groups_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Campaign groups template has been downloaded successfully",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Campaign Groups
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project-select">Select Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project" />
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

          <div>
            <Label htmlFor="file-upload">CSV File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button 
              type="submit" 
              disabled={uploadMutation.isPending || !file || !selectedProject}
              className="flex-1"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}