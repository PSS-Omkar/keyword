import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Folder } from "lucide-react";
import { CreateProjectModal } from "./CreateProjectModal";
import { EditProjectModal } from "./EditProjectModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ProjectsTable() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdvertiser, setSelectedAdvertiser] = useState("all");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: number; status: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: advertisers } = useQuery({
    queryKey: ["/api/advertisers"],
  });

  // Update project status mutation
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/projects/${id}`, { status });
    },
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/projects"] });
      
      // Snapshot the previous value
      const previousProjects = queryClient.getQueryData(["/api/projects"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(["/api/projects"], (old: any[]) => {
        return old?.map(project => 
          project.id === id ? { ...project, status } : project
        );
      });
      
      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(["/api/projects"], context?.previousProjects);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
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
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const filteredProjects = projects?.filter((project: any) => {
    const name = (project?.name || "").toLowerCase();
    const topics: string[] = Array.isArray(project?.topics) ? project.topics : [];
    const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
      topics.some((topic: string) => (topic || "").toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAdvertiser = selectedAdvertiser === "all" ||
      (advertisers?.find((adv: any) => adv.id === project?.advertiserId)?.name === selectedAdvertiser);
    return matchesSearch && matchesAdvertiser;
  }) || [];

  const getAdvertiserName = (advertiserId: number) => {
    return advertisers?.find((adv: any) => adv.id === advertiserId)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "paused":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (projectsLoading) {
    return (
      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-slate-900">Recent Projects</h3>
            <div className="flex space-x-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <Select value={selectedAdvertiser} onValueChange={setSelectedAdvertiser}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Advertisers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Advertisers</SelectItem>
                  {advertisers?.map((advertiser: any) => (
                    <SelectItem key={advertiser.id} value={advertiser.name}>
                      {advertiser.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Topics</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Languages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Countries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Keywords Volume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Keywords Bid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Advertiser</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    <Folder className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-lg font-medium">No projects found</p>
                    <p className="text-sm">Get started by creating your first project.</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project: any) => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Folder className="h-5 w-5 text-primary" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{project.name}</div>
                          <div className="text-sm text-slate-500">PRJ-{project.id.toString().padStart(3, '0')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(project.topics) ? project.topics : []).slice(0, 2).map((topic: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {(Array.isArray(project.topics) ? project.topics : []).length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{(Array.isArray(project.topics) ? project.topics : []).length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(project.languages) ? project.languages : []).slice(0, 3).map((language: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                        {(Array.isArray(project.languages) ? project.languages : []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(Array.isArray(project.languages) ? project.languages : []).length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(project.countries) ? project.countries : []).slice(0, 3).map((country: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {country}
                          </Badge>
                        ))}
                        {(Array.isArray(project.countries) ? project.countries : []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(Array.isArray(project.countries) ? project.countries : []).length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {project.keywordsVolume ? project.keywordsVolume.toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {project.keywordsBid ? `$${parseFloat(project.keywordsBid).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {getAdvertiserName(project.advertiserId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Select
                        value={project.status || 'draft'}
                        onValueChange={(newStatus) => {
                          if (newStatus === 'active') {
                            setPendingStatusChange({ id: project.id, status: newStatus });
                            setConfirmationOpen(true);
                          } else {
                            updateProjectStatusMutation.mutate({ id: project.id, status: newStatus });
                          }
                        }}
                      >
                        <SelectTrigger className={`h-7 w-20 text-xs ${
                          project.status === 'active' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : project.status === 'draft' 
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteProjectMutation.mutate(project.id)}
                          disabled={deleteProjectMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
      
      <EditProjectModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
      />

      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate this project? This will make it visible to all team members and start tracking activities.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmationOpen(false);
              setPendingStatusChange(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingStatusChange) {
                updateProjectStatusMutation.mutate(pendingStatusChange);
              }
              setConfirmationOpen(false);
              setPendingStatusChange(null);
            }}>
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
