import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dollarToMicros, microsToDollar } from "@/lib/micros";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  projectId: z.number().min(1, "Please select a project"),
  keyword: z.string().min(1, "Keyword is required"),
  volume: z.number().optional(),
  bid: z.number().optional(),
  status: z.enum(["active", "paused", "draft"]).default("active"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateKeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProjectId?: number;
}

export function CreateKeywordModal({ isOpen, onClose, preselectedProjectId }: CreateKeywordModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: preselectedProjectId || undefined,
      keyword: "",
      volume: undefined,
      bid: undefined,
      status: "active",
    },
  });

  // Fetch projects for the dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const createKeywordMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/keywords", data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log("Keyword created:", data);
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/keywords/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Also invalidate the specific project's keywords query  
      if (data?.projectId) {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && 
                   key.some(part => typeof part === 'string' && part.includes(`/api/projects/${data.projectId}/keywords`));
          }
        });
      }
      
      toast({
        title: "Success", 
        description: "Keyword created successfully",
      });
      form.reset();
      onClose();
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
        description: error.message || "Failed to create keyword",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createKeywordMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Keyword</DialogTitle>
          <DialogDescription>
            Create a new keyword for your project with targeting parameters.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={!!preselectedProjectId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project: any) => (
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
              name="keyword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keyword</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter keyword..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="volume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Search volume"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bid (USD) - optional</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="Bid amount in USD (e.g. 2.50)"
                        {...field}
                        onChange={(e) => {
                          if (e.target.value) {
                            const dollarAmount = parseFloat(e.target.value);
                            const microsValue = dollarToMicros(dollarAmount);
                            field.onChange(microsValue.toString());
                          } else {
                            field.onChange(undefined);
                          }
                        }}
                        value={field.value ? microsToDollar(field.value).toString() : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createKeywordMutation.isPending}>
                {createKeywordMutation.isPending ? "Creating..." : "Create Keyword"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}