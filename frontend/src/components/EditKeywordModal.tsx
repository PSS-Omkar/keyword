import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { dollarToMicros, microsToDollar } from "@/lib/micros";

const formSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  volume: z.number().min(0, "Volume must be 0 or greater").optional(),
  bid: z.number().min(0, "Bid must be 0 or greater").optional(),
  status: z.enum(["active", "paused", "draft"]),
  projectId: z.number().min(1, "Project is required"),
});

type FormData = z.infer<typeof formSchema>;

interface EditKeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyword: any;
}

export function EditKeywordModal({ isOpen, onClose, keyword }: EditKeywordModalProps) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: keyword?.keyword || "",
      volume: keyword?.volume || 0,
      bid: keyword?.bid ? microsToDollar(keyword.bid) : 0,
      status: keyword?.status || "active",
      projectId: keyword?.projectId || 0,
    },
  });

  // Reset form when keyword changes
  React.useEffect(() => {
    if (keyword) {
      form.reset({
        keyword: keyword.keyword || "",
        volume: keyword.volume || 0,
        bid: keyword.bid ? microsToDollar(keyword.bid) : 0,
        status: keyword.status || "active",
        projectId: keyword.projectId || 0,
      });
    }
  }, [keyword, form]);

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("PATCH", `/api/keywords/${keyword.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Keyword updated successfully",
      });
      onClose();
      form.reset();
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
        description: error.message || "Failed to update keyword",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    // Convert USD bid to micros format before submitting
    const submitData = {
      ...data,
      bid: data.bid ? dollarToMicros(data.bid).toString() : undefined
    };
    mutation.mutate(submitData);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  if (!keyword) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Keyword</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <Select
              value={form.watch("projectId")?.toString()}
              onValueChange={(value) => form.setValue("projectId", parseInt(value))}
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
            {form.formState.errors.projectId && (
              <p className="text-sm text-red-500">{form.formState.errors.projectId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyword">Keyword</Label>
            <Input
              id="keyword"
              {...form.register("keyword")}
              placeholder="Enter keyword"
            />
            {form.formState.errors.keyword && (
              <p className="text-sm text-red-500">{form.formState.errors.keyword.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume</Label>
              <Input
                id="volume"
                type="number"
                {...form.register("volume", { valueAsNumber: true })}
                placeholder="Search volume"
              />
              {form.formState.errors.volume && (
                <p className="text-sm text-red-500">{form.formState.errors.volume.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bid">Bid ($)</Label>
              <Input
                id="bid"
                type="number"
                step="0.01"
                {...form.register("bid", { valueAsNumber: true })}
                placeholder="Cost per click"
              />
              {form.formState.errors.bid && (
                <p className="text-sm text-red-500">{form.formState.errors.bid.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) => form.setValue("status", value as "active" | "paused" | "draft")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.status && (
              <p className="text-sm text-red-500">{form.formState.errors.status.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Updating..." : "Update Keyword"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}