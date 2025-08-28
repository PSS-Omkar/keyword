import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  displayName: z.string().min(1, "Display name is required"),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateTrafficSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTrafficSourceModal({ isOpen, onClose }: CreateTrafficSourceModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [fields, setFields] = useState([
    { name: "", label: "", type: "text", required: false }
  ]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      displayName: "",
      isActive: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData & { fields: any[] }) => {
      return await apiRequest("/api/traffic-sources", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/traffic-sources"] });
      toast({
        title: "Success",
        description: "Traffic source created successfully",
      });
      onClose();
      form.reset();
      setFields([{ name: "", label: "", type: "text", required: false }]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create traffic source",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const validFields = fields.filter(field => field.name && field.label);
    mutation.mutate({ ...data, fields: validFields });
  };

  const addField = () => {
    setFields([...fields, { name: "", label: "", type: "text", required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: any) => {
    setFields(fields.map((field, i) => 
      i === index ? { ...field, [key]: value } : field
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Traffic Source</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Identifier)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="facebook" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Facebook" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Enable this traffic source for campaign creation
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Configuration Fields */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Configuration Fields</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <label className="text-sm font-medium">Field Name</label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(index, "name", e.target.value)}
                        placeholder="primaryText"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-sm font-medium">Label</label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(index, "label", e.target.value)}
                        placeholder="Primary Text"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateField(index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium">Required</label>
                      <div className="flex items-center space-x-2 h-10">
                        <Switch
                          checked={field.required}
                          onCheckedChange={(checked) => updateField(index, "required", checked)}
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeField(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Creating..." : "Create Traffic Source"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}