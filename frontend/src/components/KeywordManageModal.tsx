import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, Download, X } from "lucide-react";
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

interface KeywordManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

export function KeywordManageModal({ isOpen, onClose, project }: KeywordManageModalProps) {
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newVolume, setNewVolume] = useState("");
  const [newBid, setNewBid] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: keywords, isLoading } = useQuery({
    queryKey: ["/api/projects", project?.id, "keywords"],
    queryFn: () => apiRequest("GET", `/api/projects/${project?.id}/keywords`),
    enabled: !!project?.id && isOpen,
  });

  const createKeywordMutation = useMutation({
    mutationFn: async (keywordData: any) => {
      await apiRequest("POST", `/api/projects/${project.id}/keywords`, keywordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id, "keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/keywords/all"] });
      toast({
        title: "Success",
        description: "Keyword added successfully",
      });
      setNewKeyword("");
      setNewVolume("");
      setNewBid("");
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
        description: "Failed to add keyword",
        variant: "destructive",
      });
    },
  });

  const deleteKeywordsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await apiRequest("DELETE", "/api/keywords/bulk", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id, "keywords"] });
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

  const uploadKeywordsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/projects/${project.id}/keywords/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id, "keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/keywords/all"] });
      toast({
        title: "Success",
        description: data.message,
      });
      setUploadingFile(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload keywords",
        variant: "destructive",
      });
      setUploadingFile(false);
    },
  });

  const handleSelectKeyword = (keywordId: number) => {
    setSelectedKeywords(prev =>
      prev.includes(keywordId)
        ? prev.filter(id => id !== keywordId)
        : [...prev, keywordId]
    );
  };

  const handleSelectAll = () => {
    if (selectedKeywords.length === keywords?.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(keywords?.map((k: any) => k.id) || []);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingFile(true);
      uploadKeywordsMutation.mutate(file);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "keyword,volume,bid,status\nExample Keyword,1000,1.50,active\nAnother Keyword,2000,2.00,active\n";
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

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) {
      toast({
        title: "Validation Error",
        description: "Keyword is required",
        variant: "destructive",
      });
      return;
    }

    const keywordData: any = {
      keyword: newKeyword.trim(),
      status: "active"
    };

    if (newVolume) {
      keywordData.volume = parseInt(newVolume);
    }

    if (newBid) {
      keywordData.bid = parseFloat(newBid);
    }

    createKeywordMutation.mutate(keywordData);
  };

  const handleClose = () => {
    setSelectedKeywords([]);
    setNewKeyword("");
    setNewVolume("");
    setNewBid("");
    onClose();
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Keywords - {project.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Keyword */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium text-slate-900 mb-3">Add New Keyword</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Keyword"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="md:col-span-2"
              />
              <Input
                type="number"
                placeholder="Volume"
                value={newVolume}
                onChange={(e) => setNewVolume(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Bid"
                  value={newBid}
                  onChange={(e) => setNewBid(e.target.value)}
                />
                <Button 
                  onClick={handleAddKeyword}
                  disabled={createKeywordMutation.isPending}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={downloadTemplate}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingFile}
                />
                <Button 
                  variant="outline" 
                  disabled={uploadingFile}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingFile ? "Uploading..." : "Upload CSV"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedKeywords.length === keywords?.length && keywords?.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
                <span className="text-sm">Select All</span>
              </label>
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
          </div>

          {/* Keywords List */}
          <div className="border rounded-lg">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto"></div>
                </div>
              </div>
            ) : keywords?.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No keywords found for this project</p>
                <p className="text-sm mt-1">Add keywords using the form above or upload a CSV file</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Select</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Keyword</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Volume</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {keywords?.map((keyword: any) => (
                      <tr key={keyword.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedKeywords.includes(keyword.id)}
                            onChange={() => handleSelectKeyword(keyword.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {keyword.keyword}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {keyword.volume ? keyword.volume.toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {keyword.bid ? `$${parseFloat(keyword.bid).toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={keyword.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                            {keyword.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteKeywordsMutation.mutate([keyword.id])}
                            disabled={deleteKeywordsMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}