import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertAdvertiserSchema } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

const formSchema = insertAdvertiserSchema.extend({
  channelPrefix: z.string().min(1, "Channel prefix is required"),
  channelCount: z.number().min(1).max(1000),
  domainsInput: z.string().min(1, "At least one domain is required"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateAdvertiserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAdvertiserModal({ isOpen, onClose }: CreateAdvertiserModalProps) {
  const [generatedChannels, setGeneratedChannels] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      channelPrefix: "",
      channelCount: 10,
      channelIds: [],
      domains: [],
      domainsInput: "",
      sampleUrl: "",
    },
  });

  const createAdvertiserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { channelPrefix, channelCount, domainsInput, ...advertiserData } = data;
      
      await apiRequest("POST", "/api/advertisers", {
        ...advertiserData,
        channelIds: generatedChannels,
        domains: domains,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Advertiser created successfully",
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
        description: "Failed to create advertiser",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setGeneratedChannels([]);
    setDomains([]);
    onClose();
  };

  const generateChannelIds = () => {
    const prefix = form.getValues("channelPrefix");
    const count = form.getValues("channelCount");
    
    if (!prefix) {
      toast({
        title: "Validation Error",
        description: "Please enter a channel prefix",
        variant: "destructive",
      });
      return;
    }

    const channels = [];
    for (let i = 1; i <= count; i++) {
      const paddedNumber = i.toString().padStart(3, '0');
      channels.push(`${prefix}_${paddedNumber}`);
    }
    setGeneratedChannels(channels);
  };

  const parseDomains = () => {
    const domainsInput = form.getValues("domainsInput");
    const domainList = domainsInput
      .split(",")
      .map(domain => domain.trim())
      .filter(Boolean);
    setDomains(domainList);
  };

  const removeDomain = (index: number) => {
    setDomains(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: FormData) => {
    if (generatedChannels.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please generate channel IDs",
        variant: "destructive",
      });
      return;
    }
    
    if (domains.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add domains",
        variant: "destructive",
      });
      return;
    }
    
    createAdvertiserMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Advertiser</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">Create a new advertising partner with progressive channel ID generation.</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Advertiser Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertiser Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter advertiser name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Channel ID Generation */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Channel ID Generation</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="channelPrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel Prefix</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., sedo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="channelCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Channels</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="1000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="button" onClick={generateChannelIds} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Generate Channel IDs
              </Button>

              {generatedChannels.length > 0 && (
                <div className="border rounded-lg p-3 bg-slate-50">
                  <p className="text-sm font-medium mb-2">Generated Channels ({generatedChannels.length})</p>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {generatedChannels.slice(0, 10).map((channel, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                    {generatedChannels.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{generatedChannels.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Domains */}
            <FormField
              control={form.control}
              name="domainsInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domains</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="Enter domains separated by commas"
                        {...field}
                      />
                    </FormControl>
                    <Button type="button" onClick={parseDomains} variant="outline">
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Separate multiple domains with commas</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {domains.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Added Domains</p>
                <div className="flex flex-wrap gap-1">
                  {domains.map((domain, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {domain}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer"
                        onClick={() => removeDomain(index)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Sample URL */}
            <FormField
              control={form.control}
              name="sampleUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/sample" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAdvertiserMutation.isPending}>
                {createAdvertiserMutation.isPending ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Advertiser
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