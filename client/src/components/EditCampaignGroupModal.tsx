import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  projectId: z.number().min(1, "Project is required"),
  advertiserId: z.number().min(1, "Advertiser is required"),
  trafficSourceId: z.number().min(1, "Traffic Source is required"),
  status: z.enum(["active", "paused", "completed"]),
  // AI Creation Prompt Fields
  aiPrimaryText: z.string().min(1, "Primary text prompt is required"),
  aiHeadline: z.string().min(1, "Headline prompt is required"),
  aiCta: z.string().min(1, "CTA prompt is required"),
  aiImage: z.string().min(1, "Image prompt is required"),
  aiVideo: z.string().min(1, "Video prompt is required"),
  aiVariants: z.number().min(1, "At least 1 variant is required").max(10, "Maximum 10 variants allowed"),
});

type FormData = z.infer<typeof formSchema>;

interface EditCampaignGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignGroup: any;
}

export function EditCampaignGroupModal({ isOpen, onClose, campaignGroup }: EditCampaignGroupModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: campaignGroup?.name || "",
      projectId: campaignGroup?.projectId || 0,
      advertiserId: campaignGroup?.advertiserId || 0,
      trafficSourceId: campaignGroup?.trafficSourceId || 0,
      status: campaignGroup?.status || "active",
      // AI Creation Prompt Fields
      aiPrimaryText: campaignGroup?.aiPrimaryText || "Create engaging primary text for this campaign that highlights the key benefits and drives action.",
      aiHeadline: campaignGroup?.aiHeadline || "Write a compelling headline that grabs attention and clearly communicates the main value proposition.",
      aiCta: campaignGroup?.aiCta || "Generate a strong call-to-action that encourages immediate user engagement and conversions.",
      aiImage: campaignGroup?.aiImage || "Describe the ideal image for this campaign that visually represents the product/service and appeals to the target audience.",
      aiVideo: campaignGroup?.aiVideo || "Outline the concept for a video ad that tells a compelling story and showcases the key features effectively.",
      aiVariants: campaignGroup?.aiVariants || 1,
    },
  });

  // Reset form when campaign group changes
  React.useEffect(() => {
    if (campaignGroup) {
      form.reset({
        name: campaignGroup.name,
        projectId: campaignGroup.projectId,
        advertiserId: campaignGroup.advertiserId,
        trafficSourceId: campaignGroup.trafficSourceId,
        status: campaignGroup.status,
        // AI Creation Prompt Fields
        aiPrimaryText: campaignGroup.aiPrimaryText || "Create engaging primary text for this campaign that highlights the key benefits and drives action.",
        aiHeadline: campaignGroup.aiHeadline || "Write a compelling headline that grabs attention and clearly communicates the main value proposition.",
        aiCta: campaignGroup.aiCta || "Generate a strong call-to-action that encourages immediate user engagement and conversions.",
        aiImage: campaignGroup.aiImage || "Describe the ideal image for this campaign that visually represents the product/service and appeals to the target audience.",
        aiVideo: campaignGroup.aiVideo || "Outline the concept for a video ad that tells a compelling story and showcases the key features effectively.",
        aiVariants: campaignGroup.aiVariants || 1,
      });
    }
  }, [campaignGroup, form]);

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
  const projectKeywords = keywords?.filter((k: any) => k.projectId === form.watch("projectId"));

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("PATCH", `/api/campaign-groups/${campaignGroup.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign group updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/campaign-groups"] });
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
        description: "Failed to update campaign group",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Campaign Group</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign group name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
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

            <FormField
              control={form.control}
              name="advertiserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertiser</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an advertiser" />
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

            <FormField
              control={form.control}
              name="trafficSourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Traffic Source</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a traffic source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {trafficSources?.map((source: any) => (
                        <SelectItem key={source.id} value={source.id.toString()}>
                          {source.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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

            {/* Keywords Preview Section */}
            {form.watch("projectId") && (
              <div className="space-y-2">
                <FormLabel>Keywords (Auto-selected from Project)</FormLabel>
                <div className="max-h-32 overflow-y-auto border rounded-md p-3 bg-slate-50">
                  {keywordsLoading ? (
                    <div className="text-sm text-slate-500">Loading keywords...</div>
                  ) : keywordsError ? (
                    <div className="text-sm text-red-500">Error loading keywords</div>
                  ) : projectKeywords && projectKeywords.length > 0 ? (
                    <div className="grid grid-cols-1 gap-1">
                      {projectKeywords.map((keyword: any) => (
                        <div key={keyword.id} className="text-xs text-slate-600 flex justify-between">
                          <span>{keyword.keyword}</span>
                          <span>Vol: {keyword.volume}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No keywords found for this project</div>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {projectKeywords?.length || 0} keywords will be included in this campaign group
                </div>
              </div>
            )}

              <div className="flex justify-end space-x-2 pt-6 border-t border-slate-200 bg-white sticky bottom-0">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Updating..." : "Update Campaign Group"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}