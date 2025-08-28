import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertCampaignGroupSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = insertCampaignGroupSchema;
type FormData = z.infer<typeof formSchema>;

interface CreateCampaignGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
}

export function CreateCampaignGroupModal({ isOpen, onClose, projectId }: CreateCampaignGroupModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Debug logging
  React.useEffect(() => {
    console.log("CreateCampaignGroupModal rendered", { isOpen, projectId });
  }, [isOpen, projectId]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: projectId || undefined,
      advertiserId: undefined,
      name: "",
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

  const { data: keywords, isLoading: keywordsLoading, error: keywordsError } = useQuery({
    queryKey: ["/api/keywords"],
    refetchOnMount: true,
    retry: 1,
  });

  const selectedProject = projects?.find((p: any) => p.id === form.watch("projectId"));
  const selectedAdvertiser = advertisers?.find((a: any) => a.id === form.watch("advertiserId"));
  const projectKeywords = keywords?.filter((k: any) => k.projectId === form.watch("projectId"));
  
  // Debug logging
  React.useEffect(() => {
    console.log("Selected project ID:", form.watch("projectId"));
    console.log("All keywords:", keywords);
    console.log("Keywords loading:", keywordsLoading);
    console.log("Keywords error:", keywordsError);
    console.log("Filtered project keywords:", projectKeywords);
    if (keywords && keywords.length > 0) {
      console.log("Sample keyword:", keywords[0]);
    }
  }, [form.watch("projectId"), keywords, projectKeywords, keywordsLoading, keywordsError]);
  
  // Auto-populate advertiser when project is selected
  React.useEffect(() => {
    if (selectedProject?.advertiserId) {
      form.setValue("advertiserId", selectedProject.advertiserId);
    }
  }, [selectedProject, form]);

  const createCampaignGroupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Making API request to create campaign group:", data);
      return await apiRequest("POST", "/api/campaign-groups", data);
    },
    onSuccess: (result) => {
      console.log("Campaign group created successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Success",
        description: "Campaign group created successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      console.error("Error creating campaign group:", error);
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
        description: `Failed to create campaign group: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const onSubmit = (data: FormData) => {
    console.log("Campaign Group form submitted with data:", data);
    console.log("Form validation errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    
    createCampaignGroupMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="campaign-group-description">
        <DialogHeader>
          <DialogTitle>Create New Campaign Group</DialogTitle>
        </DialogHeader>
        <p id="campaign-group-description" className="text-sm text-slate-600">
          Create a campaign group that will automatically include all keywords from the selected project.
        </p>
        
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
                    onValueChange={(value) => {
                      console.log("Project selected:", value);
                      field.onChange(parseInt(value));
                    }} 
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

            {/* Display project keywords count */}
            {form.watch("projectId") && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {projectKeywords && projectKeywords.length > 0 ? (
                  <>
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      Keywords included: {projectKeywords.length} keywords from this project will be automatically included
                    </p>
                    <div className="max-h-32 overflow-y-auto">
                      <div className="flex flex-wrap gap-1">
                        {projectKeywords.slice(0, 15).map((keyword: any) => (
                          <span key={keyword.id} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {keyword.keyword}
                          </span>
                        ))}
                        {projectKeywords.length > 15 && (
                          <span className="text-blue-600 text-xs px-2 py-1">
                            +{projectKeywords.length - 15} more keywords
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-orange-800">
                    <strong>No keywords found</strong> for this project. Add keywords to the project first.
                  </p>
                )}
              </div>
            )}

            {/* 2. Campaign Group Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign group name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Advertiser (auto-populated from project) */}
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

            {/* 4. Traffic Source */}
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
                      <FormLabel>Call to Action</FormLabel>
                      <FormControl>
                        <Input placeholder="Call to action" {...field} />
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
                        <Input placeholder="Image URL" {...field} />
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
                        <Input placeholder="Video URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Campaign description" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCampaignGroupMutation.isPending}
                onClick={(e) => {
                  console.log("Create Campaign Group button clicked, form valid:", form.formState.isValid);
                  console.log("Form data:", form.getValues());
                }}
              >
                {createCampaignGroupMutation.isPending ? "Creating..." : "Create Campaign Group"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}