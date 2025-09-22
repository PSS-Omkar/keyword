import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Upload, Download, Edit, FileSpreadsheet } from "lucide-react";
import * as XLSX from 'xlsx';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { KeywordManageModal } from "@/components/KeywordManageModal";
import { CreateKeywordModal } from "@/components/CreateKeywordModal";
import { EditKeywordModal } from "@/components/EditKeywordModal";
import { NavigationHeader } from "@/components/NavigationHeader";
import { formatMicrosAsCurrency, formatMicros } from "@/lib/micros";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Keywords() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<any>(null);
  const [isCreateKeywordModalOpen, setIsCreateKeywordModalOpen] = useState(false);
  const [isEditKeywordModalOpen, setIsEditKeywordModalOpen] = useState(false);
  const [selectedKeywordForEdit, setSelectedKeywordForEdit] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export keywords to Excel
  const exportToExcel = () => {
    if (!filteredKeywords || filteredKeywords.length === 0) {
      toast({
        title: "No data to export",
        description: "Please add some keywords before exporting.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for export
    const exportData = filteredKeywords.map(keyword => ({
      "Project Name": keyword.projectName || "Unknown",
      "Keyword": keyword.keyword,
      "Volume": keyword.volume,
      "Bid": keyword.bid,
      "Status": keyword.status,
      "Created Date": new Date(keyword.createdAt).toLocaleDateString(),
      "Updated Date": new Date(keyword.updatedAt).toLocaleDateString(),
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Project Name
      { wch: 30 }, // Keyword
      { wch: 10 }, // Volume
      { wch: 10 }, // Bid
      { wch: 12 }, // Status
      { wch: 15 }, // Created Date
      { wch: 15 }, // Updated Date
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Keywords");

    // Generate filename with current date
    const now = new Date();
    const filename = `keywords_export_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    toast({
      title: "Export successful",
      description: `Downloaded ${exportData.length} keywords to ${filename}`,
    });
  };

  // Edit keyword function
  const handleEditKeyword = (keyword: any) => {
    setSelectedKeywordForEdit(keyword);
    setIsEditKeywordModalOpen(true);
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: allKeywords, isLoading } = useQuery({
    queryKey: ["/api/keywords/all"],
    queryFn: async () => {
      if (!projects) return [];
      
      console.log("Fetching keywords for projects:", projects);
      
      const keywordPromises = projects.map((project: any) =>
        apiRequest("GET", `/api/projects/${project.id}/keywords`)
          .then((response: Response) => response.json())
          .then((keywords: any[]) => {
            console.log(`Keywords for project ${project.id}:`, keywords);
            return keywords.map(keyword => ({
              ...keyword,
              projectName: project.name,
              projectId: project.id
            }));
          })
          .catch((error) => {
            console.error(`Error fetching keywords for project ${project.id}:`, error);
            return [];
          })
      );
      
      const results = await Promise.all(keywordPromises);
      const flatResults = results.flat();
      console.log("All keywords:", flatResults);
      return flatResults;
    },
    enabled: !!projects,
    staleTime: 0, // Always refetch
    refetchOnWindowFocus: true,
  });

  const deleteKeywordsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      console.log("deleteKeywordsMutation called with:", ids);
      console.log("selectedKeywords state:", selectedKeywords);
      
      // Ensure IDs are numbers and remove any invalid ones
      const validIds = ids.filter(id => {
        const isValid = typeof id === 'number' && !isNaN(id) && id > 0;
        console.log(`ID ${id} (type: ${typeof id}) is valid: ${isValid}`);
        return isValid;
      });
      
      console.log("Valid IDs after filtering:", validIds);
      
      if (validIds.length === 0) {
        throw new Error("No valid keywords selected");
      }
      
      const response = await apiRequest("DELETE", "/api/keywords/bulk", { ids: validIds });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords/all"] });
      toast({
        title: "Success",
        description: "Keywords deleted successfully",
      });
      setSelectedKeywords([]);
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
        description: "Failed to delete keywords",
        variant: "destructive",
      });
    },
  });

  const filteredKeywords = allKeywords?.filter(keyword => {
    const matchesSearch = keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         keyword.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === "all" || keyword.projectId.toString() === selectedProject;
    return matchesSearch && matchesProject;
  }) || [];

  const handleSelectKeyword = (keywordId: number) => {
    setSelectedKeywords(prev =>
      prev.includes(keywordId)
        ? prev.filter(id => id !== keywordId)
        : [...prev, keywordId]
    );
  };

  const handleSelectAll = () => {
    if (selectedKeywords.length === filteredKeywords.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(filteredKeywords.map(k => k.id));
    }
  };

  const downloadTemplate = () => {
    const csvContent = "project_name,keyword,volume,bid,status\nExample Project,Example Keyword,1000,1.50,active\nExample Project,Another Keyword,2000,2.00,paused\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "keywords_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManageKeywords = (project: any) => {
    setSelectedProjectForModal(project);
    setIsManageModalOpen(true);
  };

  const uploadKeywordsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/keywords/upload-bulk", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/keywords/all"] });
      toast({
        title: "Success",
        description: `Uploaded ${data.created} keywords successfully`,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        description: error.message || "Failed to upload keywords",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadKeywordsMutation.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavigationHeader />
      <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Keywords</h1>
          <p className="text-slate-600 mt-2">Manage keywords for your advertising projects</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            style={{ display: "none" }}
          />
          <Button 
            variant="outline" 
            onClick={downloadTemplate}
            className="flex items-center gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download Template</span>
            <span className="sm:hidden">Template</span>
          </Button>
          <Button 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadKeywordsMutation.isPending}
            className="flex items-center gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{uploadKeywordsMutation.isPending ? "Uploading..." : "Upload CSV"}</span>
            <span className="sm:hidden">Upload</span>
          </Button>
          <Button 
            variant="outline"
            onClick={exportToExcel}
            className="flex items-center gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button 
            onClick={() => setIsCreateKeywordModalOpen(true)}
            className="flex items-center gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Keyword</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search keywords or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedKeywords.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedKeywords.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Keywords</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedKeywords.length} selected keyword(s)? 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteKeywordsMutation.mutate(selectedKeywords)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Keywords Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Keywords ({filteredKeywords.length})</CardTitle>
            <div className="flex gap-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedKeywords.length === filteredKeywords.length && filteredKeywords.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
                <span className="text-sm">Select All</span>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredKeywords.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-slate-600 mb-4">No keywords found</p>
              <p className="text-sm text-slate-500">
                {searchTerm || selectedProject !== "all" 
                  ? "Try adjusting your search filters" 
                  : "Create some projects and add keywords to get started"
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Keyword
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Bid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredKeywords.map((keyword: any) => (
                      <tr key={keyword.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedKeywords.includes(keyword.id)}
                            onChange={() => handleSelectKeyword(keyword.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">
                              {keyword.projectName}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManageKeywords({ id: keyword.projectId, name: keyword.projectName })}
                              className="p-1 h-6 w-6"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {keyword.keyword}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {keyword.volume ? keyword.volume.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {keyword.highTopOfPageBidUSD ? `$${keyword.highTopOfPageBidUSD.toFixed(2)}` : (keyword.bid ? formatMicrosAsCurrency(keyword.bid) : '-')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={keyword.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                            {keyword.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditKeyword(keyword)}
                            >
                              <Edit className="h-4 w-4 text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteKeywordsMutation.mutate([keyword.id])}
                              disabled={deleteKeywordsMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredKeywords.map((keyword: any) => (
                  <div key={keyword.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedKeywords.includes(keyword.id)}
                          onChange={() => handleSelectKeyword(keyword.id)}
                          className="rounded mt-1"
                        />
                        <div>
                          <h3 className="font-medium text-slate-900">{keyword.keyword}</h3>
                          <p className="text-sm text-slate-600">{keyword.projectName}</p>
                        </div>
                      </div>
                      <Badge className={keyword.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                        {keyword.status}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-slate-500 mb-3">
                      <span>Volume: {keyword.volume ? keyword.volume.toLocaleString() : "-"}</span>
                      <span>Bid: {keyword.highTopOfPageBidUSD ? `$${keyword.highTopOfPageBidUSD.toFixed(2)}` : (keyword.bid ? formatMicrosAsCurrency(keyword.bid) : "-")}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManageKeywords({ id: keyword.projectId, name: keyword.projectName })}
                        className="text-slate-600"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Project
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditKeyword(keyword)}
                          className="p-2"
                        >
                          <Edit className="h-4 w-4 text-blue-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteKeywordsMutation.mutate([keyword.id])}
                          disabled={deleteKeywordsMutation.isPending}
                          className="p-2"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <KeywordManageModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedProjectForModal(null);
        }}
        project={selectedProjectForModal}
      />

      <CreateKeywordModal
        isOpen={isCreateKeywordModalOpen}
        onClose={() => setIsCreateKeywordModalOpen(false)}
      />

      <EditKeywordModal
        isOpen={isEditKeywordModalOpen}
        onClose={() => {
          setIsEditKeywordModalOpen(false);
          setSelectedKeywordForEdit(null);
        }}
        keyword={selectedKeywordForEdit}
      />
      </div>
    </>
  );
}