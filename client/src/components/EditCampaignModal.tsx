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
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = insertCampaignSchema.partial();

type FormData = z.infer<typeof formSchema>;

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: any;
}

export function EditCampaignModal({ isOpen, onClose, campaign }: EditCampaignModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: campaign?.projectId || undefined,
      advertiserId: campaign?.advertiserId || undefined,
      keyword: campaign?.keyword || "",
      trafficSource: campaign?.trafficSource || "",
      status: campaign?.status || "draft",
      // AI Creation Prompt Fields
      aiPrimaryText: campaign?.aiPrimaryText || "Create engaging primary text for this campaign that highlights the key benefits and drives action.",
      aiHeadline: campaign?.aiHeadline || "Write a compelling headline that grabs attention and clearly communicates the main value proposition.",
      aiCta: campaign?.aiCta || "Generate a strong call-to-action that encourages immediate user engagement and conversions.",
      aiImage: campaign?.aiImage || "Describe the ideal image for this campaign that visually represents the product/service and appeals to the target audience.",
      aiVideo: campaign?.aiVideo || "Outline the concept for a video ad that tells a compelling story and showcases the key features effectively.",
      aiVariants: campaign?.aiVariants || 1,
      // Optional fields
      url: campaign?.url || "",
      channelId: campaign?.channelId || "",
      primaryText: campaign?.primaryText || "",
      headline: campaign?.headline || "",
      description: campaign?.description || "",
      cta: campaign?.cta || "",
      image: campaign?.image || "",
      video: campaign?.video || "",
    },
  });

  // Reset form when campaign changes
  React.useEffect(() => {
    if (campaign) {
      form.reset({
        projectId: campaign.projectId,
        advertiserId: campaign.advertiserId,
        keyword: campaign.keyword,
        trafficSource: campaign.trafficSource,
        status: campaign.status,
        // AI Creation Prompt Fields
        aiPrimaryText: campaign.aiPrimaryText || "Create engaging primary text for this campaign that highlights the key benefits and drives action.",
        aiHeadline: campaign.aiHeadline || "Write a compelling headline that grabs attention and clearly communicates the main value proposition.",
        aiCta: campaign.aiCta || "Generate a strong call-to-action that encourages immediate user engagement and conversions.",
        aiImage: campaign.aiImage || "Describe the ideal image for this campaign that visually represents the product/service and appeals to the target audience.",
        aiVideo: campaign.aiVideo || "Outline the concept for a video ad that tells a compelling story and showcases the key features effectively.",
        // Optional fields
        url: campaign.url || "",
        channelId: campaign.channelId || "",
        primaryText: campaign.primaryText || "",
        headline: campaign.headline || "",
        description: campaign.description || "",
        cta: campaign.cta || "",
        image: campaign.image || "",
        video: campaign.video || "",
      });
    }
  }, [campaign, form]);

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: advertisers } = useQuery({
    queryKey: ["/api/advertisers"],
  });

  const { data: trafficSources } = useQuery({
    queryKey: ["/api/traffic-sources"],
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("PATCH", `/api/campaigns/${campaign.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      onClose();
      form.reset();
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
        description: "Failed to update campaign",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      onClose();
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Project */}
              <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString()}
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

            {/* Advertiser */}
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

            {/* Traffic Source */}
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

            {/* Keyword */}
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

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

            {/* Optional Campaign Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Optional Campaign Details</h3>
                <div className="h-px bg-border flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* URL */}
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
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
                      <FormControl>
                        <Input placeholder="Enter channel ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Primary Text */}
              <FormField
                control={form.control}
                name="primaryText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Text</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter campaign primary text" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Headline */}
                <FormField
                  control={form.control}
                  name="headline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headline</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter headline" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CTA */}
                <FormField
                  control={form.control}
                  name="cta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Call to Action</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Learn More, Shop Now" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter campaign description" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image */}
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

                {/* Video */}
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
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 bg-white sticky bottom-0">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Updating..." : "Update Campaign"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}