import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavigationHeader } from "@/components/NavigationHeader";
import { CreateTrafficSourceModal } from "@/components/CreateTrafficSourceModal";
import { EditTrafficSourceModal } from "@/components/EditTrafficSourceModal";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TrafficSources() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTrafficSource, setEditingTrafficSource] = useState<any>(null);

  const { data: trafficSources = [], isLoading } = useQuery({
    queryKey: ["/api/traffic-sources"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/traffic-sources/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/traffic-sources"] });
      toast({
        title: "Success",
        description: "Traffic source deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete traffic source",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this traffic source?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <NavigationHeader />
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Traffic Sources</h1>
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading traffic sources...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <NavigationHeader />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Traffic Sources</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage traffic sources and their configuration fields
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Traffic Source
          </Button>
        </div>

        {/* Traffic Sources Grid */}
        {trafficSources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Settings className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No traffic sources found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
                Get started by creating your first traffic source configuration
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Traffic Source
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trafficSources.map((source: any) => (
              <Card key={source.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{source.displayName}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {source.name}
                      </p>
                    </div>
                    <Badge variant={source.isActive ? "default" : "secondary"}>
                      {source.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fields */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Configuration Fields</h4>
                    {source.fields && source.fields.length > 0 ? (
                      <div className="space-y-1">
                        {source.fields.slice(0, 3).map((field: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{field.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                          </div>
                        ))}
                        {source.fields.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{source.fields.length - 3} more fields
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No fields configured</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTrafficSource(source)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(source.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTrafficSourceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {editingTrafficSource && (
        <EditTrafficSourceModal
          isOpen={!!editingTrafficSource}
          onClose={() => setEditingTrafficSource(null)}
          trafficSource={editingTrafficSource}
        />
      )}
    </div>
  );
}