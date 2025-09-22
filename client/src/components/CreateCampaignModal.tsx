import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertCampaignSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = insertCampaignSchema;

type FormData = z.infer<typeof formSchema>;

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
}

export function CreateCampaignModal({ isOpen, onClose, projectId }: CreateCampaignModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: projectId || undefined,
      advertiserId: undefined,
      keyword: "",
      trafficSource: "",
      status: "draft",
      // AI Creation Prompt Fields with defaults
      aiPrimaryText: "Create engaging primary text for this campaign that highlights the key benefits and drives action.",
      aiHeadline: "Write a compelling headline that grabs attention and clearly communicates the main value proposition.",
      aiCta: "Generate a strong call-to-action that encourages immediate user engagement and conversions.",
      aiImage: "Describe the ideal image for this campaign that visually represents the product/service and appeals to the target audience.",
      aiVideo: "Outline the concept for a video ad that tells a compelling story and showcases the key features effectively.",
      aiVariants: 1,
      // Optional fields
      url: "",
      channelId: "",
      primaryText: "",
      headline: "",
      description: "",
      cta: "",
      image: "",
      video: "",
    },
  });

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: advertisers } = useQuery({
    queryKey: ["/api/advertisers"],
  });

  const { data: trafficSources } = useQuery({
    queryKey: ["/api/traffic-sources"],
  });

  const selectedProject = projects?.find((p: any) => p.id === form.watch("projectId"));
  const selectedAdvertiser = advertisers?.find((a: any) => a.id === form.watch("advertiserId"));
  
  // Auto-populate advertiser when project is selected
  React.useEffect(() => {
    if (selectedProject?.advertiserId) {
      form.setValue("advertiserId", selectedProject.advertiserId);
    }
  }, [selectedProject, form]);

  const createCampaignMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/campaigns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "campaigns"] });
      }
      toast({
        title: "Success",
        description: "Campaign created successfully",
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
        description: "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: FormData) => {
    createCampaignMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">Create a new advertising campaign with keyword targeting.</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. Project Selection */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString()}
                    disabled={!!projectId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.map((project: any) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Advertiser (auto-populated from project) */}
            <FormField
              control={form.control}
              name="advertiserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertiser</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select advertiser" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {advertisers?.map((advertiser: any) => (
                        <SelectItem key={advertiser.id} value={advertiser.id.toString()}>
                          {advertiser.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Traffic Source */}
            <FormField
              control={form.control}
              name="trafficSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Traffic Source</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select traffic source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {trafficSources?.map((source: any) => (
                        <SelectItem key={source.id} value={source.name}>
                          {source.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. Keyword */}
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keyword</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign keyword" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5. Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AI Creation Prompt Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">AI Creation Prompt</h3>
                <div className="h-px bg-border flex-1"></div>
              </div>
              
              {/* AI Primary Text */}
              <FormField
                control={form.control}
                name="aiPrimaryText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Text Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter AI prompt for primary text creation" 
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Headline */}
              <FormField
                control={form.control}
                name="aiHeadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter AI prompt for headline creation" 
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI CTA */}
              <FormField
                control={form.control}
                name="aiCta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTA Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter AI prompt for CTA creation" 
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Image */}
              <FormField
                control={form.control}
                name="aiImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter AI prompt for image creation" 
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Video */}
              <FormField
                control={form.control}
                name="aiVideo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter AI prompt for video creation" 
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Variants */}
              <FormField
                control={form.control}
                name="aiVariants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variants</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Number of variants to generate"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        value={field.value || 1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Optional Fields Section */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-medium text-slate-900 mb-4">Additional Campaign Details (Optional)</h3>
              
              {/* Primary Text - First field */}
              <div className="mb-4">
                <FormField
                  control={form.control}
                  name="primaryText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Text</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Main campaign text content" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campaign URL */}
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/campaign" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Channel ID */}
                <FormField
                  control={form.control}
                  name="channelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel ID</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a channel ID" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedAdvertiser?.channelIds?.map((channelId: string) => (
                            <SelectItem key={channelId} value={channelId}>
                              {channelId}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!selectedAdvertiser && (
                        <p className="text-xs text-slate-500">Select an advertiser to see available channel IDs</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />



                {/* Headline */}
                <FormField
                  control={form.control}
                  name="headline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headline</FormLabel>
                      <FormControl>
                        <Input placeholder="Campaign headline" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Call to Action */}
                <FormField
                  control={form.control}
                  name="cta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call to Action (CTA)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Learn More, Shop Now, Sign Up" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image URL */}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Video URL */}
                <FormField
                  control={form.control}
                  name="video"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/video.mp4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCampaignMutation.isPending}>
                {createCampaignMutation.isPending ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}