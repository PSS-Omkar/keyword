import { useState, useEffect } from "react";
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
import { X, Save, Plus } from "lucide-react";

const formSchema = insertAdvertiserSchema.extend({
  channelPrefix: z.string().optional(),
  channelCount: z.number().optional(),
  domainsInput: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditAdvertiserModalProps {
  isOpen: boolean;
  onClose: () => void;
  advertiser: any;
}

export function EditAdvertiserModal({ isOpen, onClose, advertiser }: EditAdvertiserModalProps) {
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

  useEffect(() => {
    if (advertiser && isOpen) {
      form.reset({
        name: advertiser.name || "",
        channelIds: advertiser.channelIds || [],
        domains: advertiser.domains || [],
        sampleUrl: advertiser.sampleUrl || "",
        channelPrefix: "",
        channelCount: 10,
        domainsInput: "",
      });
      setGeneratedChannels(advertiser.channelIds || []);
      setDomains(advertiser.domains || []);
    }
  }, [advertiser, isOpen, form]);

  const updateAdvertiserMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { channelPrefix, channelCount, domainsInput, ...advertiserData } = data;
      
      await apiRequest("PUT", `/api/advertisers/${advertiser.id}`, {
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
        description: "Advertiser updated successfully",
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
        description: "Failed to update advertiser",
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
    for (let i = 1; i <= (count || 10); i++) {
      const paddedNumber = i.toString().padStart(3, '0');
      channels.push(`${prefix}_${paddedNumber}`);
    }
    setGeneratedChannels([...generatedChannels, ...channels]);
  };

  const addChannelManually = () => {
    const prefix = form.getValues("channelPrefix");
    if (prefix) {
      setGeneratedChannels([...generatedChannels, prefix]);
      form.setValue("channelPrefix", "");
    }
  };

  const removeChannel = (index: number) => {
    setGeneratedChannels(prev => prev.filter((_, i) => i !== index));
  };

  const parseDomains = () => {
    const domainsInput = form.getValues("domainsInput");
    const domainList = domainsInput
      .split(",")
      .map(domain => domain.trim())
      .filter(Boolean);
    setDomains([...domains, ...domainList]);
    form.setValue("domainsInput", "");
  };

  const removeDomain = (index: number) => {
    setDomains(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: FormData) => {
    updateAdvertiserMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Advertiser</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">Modify advertiser details and manage channel IDs.</p>
        
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

            {/* Current Channel IDs */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Channel IDs</h3>
              {generatedChannels.length > 0 && (
                <div className="border rounded-lg p-3 bg-slate-50 max-h-32 overflow-y-auto">
                  <p className="text-sm font-medium mb-2">Current Channels ({generatedChannels.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedChannels.map((channel, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {channel}
                        <X 
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={() => removeChannel(index)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add More Channels */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Add More Channels</p>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="channelPrefix"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Prefix or ID" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="channelCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Count"
                            min="1" 
                            max="1000"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-1">
                    <Button type="button" onClick={generateChannelIds} variant="outline" size="sm">
                      Generate
                    </Button>
                    <Button type="button" onClick={addChannelManually} variant="outline" size="sm">
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Domains */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="domainsInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Add Domains</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {domains.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Domains</p>
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
            </div>

            {/* Sample URL */}
            <FormField
              control={form.control}
              name="sampleUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample URL</FormLabel>
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
              <Button type="submit" disabled={updateAdvertiserMutation.isPending}>
                {updateAdvertiserMutation.isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
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