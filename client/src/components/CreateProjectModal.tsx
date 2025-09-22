import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertProjectSchema } from "@shared/schema";
import { COUNTRIES, LANGUAGES } from "@shared/countries-languages";
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
import { X, Plus, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const formSchema = insertProjectSchema.extend({
  topicsInput: z.string().min(1, "At least one topic is required"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Now using COUNTRIES and LANGUAGES from shared mapping

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["EN"]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["US"]);
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      topicsInput: "",
      topics: [],
      languages: [],
      countries: [],
      keywordsVolume: undefined,
      keywordsBid: undefined,
      numberOfKeywords: 30,
      advertiserId: undefined,
      status: "draft",
    },
  });

  const { data: advertisers } = useQuery({
    queryKey: ["/api/advertisers"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { topicsInput, ...projectData } = data;
      const topics = topicsInput.split(",").map(topic => topic.trim()).filter(Boolean);
      
      await apiRequest("POST", "/api/projects", {
        ...projectData,
        topics,
        languages: selectedLanguages,
        countries: selectedCountries,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Project created successfully",
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
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setSelectedLanguages(["EN"]);
    setSelectedCountries(["US"]);
    setLanguagePopoverOpen(false);
    setCountryPopoverOpen(false);
    setLanguageSearch("");
    setCountrySearch("");
    onClose();
  };

  const toggleLanguage = (languageCode: string) => {
    setSelectedLanguages(prev => 
      prev.includes(languageCode)
        ? prev.filter(l => l !== languageCode)
        : [...prev, languageCode]
    );
  };

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries(prev =>
      prev.includes(countryCode)
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  const removeLanguage = (languageCode: string) => {
    setSelectedLanguages(prev => prev.filter(l => l !== languageCode));
  };

  const removeCountry = (countryCode: string) => {
    setSelectedCountries(prev => prev.filter(c => c !== countryCode));
  };

  const onSubmit = (data: FormData) => {
    if (selectedLanguages.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one language",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedCountries.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one country",
        variant: "destructive",
      });
      return;
    }
    
    createProjectMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Topics */}
            <FormField
              control={form.control}
              name="topicsInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topics</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter topics separated by commas"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">Separate multiple topics with commas</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Keywords Volume */}
            <FormField
              control={form.control}
              name="keywordsVolume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords Volume</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 10000"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">Monthly search volume</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Keywords Bid */}
            <FormField
              control={form.control}
              name="keywordsBid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords Bid</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1.50"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">Cost per click in USD</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Number of Keywords */}
            <FormField
              control={form.control}
              name="numberOfKeywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Keywords</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      placeholder="30"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          field.onChange("");
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 1) {
                            field.onChange(numValue);
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <p className="text-xs text-slate-500">Target number of keywords for this project</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Languages */}
            <FormItem>
              <FormLabel>Languages</FormLabel>
              <Popover open={languagePopoverOpen} onOpenChange={setLanguagePopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="min-h-[42px] px-3 py-2 border border-slate-300 rounded-lg shadow-sm bg-white cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                    <div className="flex flex-wrap gap-1">
                      {selectedLanguages.length === 0 ? (
                        <span className="text-slate-400 text-sm">Select languages...</span>
                      ) : (
                        selectedLanguages.map(langCode => {
                          const language = LANGUAGES.find(l => l.code === langCode);
                          return (
                            <Badge key={langCode} variant="secondary" className="text-xs">
                              {language?.name} ({langCode})
                              <X 
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeLanguage(langCode);
                                }}
                              />
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 max-h-80" align="start">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search languages..."
                        value={languageSearch}
                        onChange={(e) => setLanguageSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2">
                    <div className="space-y-2">
                      {LANGUAGES
                        .filter(language => 
                          language.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
                          language.code.toLowerCase().includes(languageSearch.toLowerCase())
                        )
                        .map(language => (
                          <div key={language.code} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded">
                            <Checkbox
                              id={`language-${language.code}`}
                              checked={selectedLanguages.includes(language.code)}
                              onCheckedChange={() => toggleLanguage(language.code)}
                            />
                            <label
                              htmlFor={`language-${language.code}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {language.name} ({language.code})
                            </label>
                          </div>
                        ))}
                    </div>
                    {LANGUAGES.filter(language => 
                      language.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
                      language.code.toLowerCase().includes(languageSearch.toLowerCase())
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No languages found matching "{languageSearch}"
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </FormItem>

            {/* Countries */}
            <FormItem>
              <FormLabel>Countries</FormLabel>
              <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="min-h-[42px] px-3 py-2 border border-slate-300 rounded-lg shadow-sm bg-white cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                    <div className="flex flex-wrap gap-1">
                      {selectedCountries.length === 0 ? (
                        <span className="text-slate-400 text-sm">Select countries...</span>
                      ) : (
                        selectedCountries.map(countryCode => {
                          const country = COUNTRIES.find(c => c.code === countryCode);
                          return (
                            <Badge key={countryCode} variant="secondary" className="text-xs">
                              {country?.name} ({countryCode})
                              <X 
                                className="ml-1 h-3 w-3 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeCountry(countryCode);
                                }}
                              />
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 max-h-80" align="start">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search countries..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-2">
                    <div className="space-y-2">
                      {COUNTRIES
                        .filter(country => 
                          country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                          country.code.toLowerCase().includes(countrySearch.toLowerCase())
                        )
                        .map(country => (
                          <div key={country.code} className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded">
                            <Checkbox
                              id={`country-${country.code}`}
                              checked={selectedCountries.includes(country.code)}
                              onCheckedChange={() => toggleCountry(country.code)}
                            />
                            <label
                              htmlFor={`country-${country.code}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {country.name} ({country.code})
                            </label>
                          </div>
                        ))}
                    </div>
                    {COUNTRIES.filter(country => 
                      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                      country.code.toLowerCase().includes(countrySearch.toLowerCase())
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No countries found matching "{countrySearch}"
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </FormItem>

            {/* Advertiser */}
            <FormField
              control={form.control}
              name="advertiserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advertiser</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an advertiser" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(advertisers) ? advertisers.map((advertiser: any) => (
                        <SelectItem key={advertiser.id} value={advertiser.id.toString()}>
                          {advertiser.name}
                        </SelectItem>
                      )) : []}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProjectMutation.isPending}>
                {createProjectMutation.isPending ? (
                  "Creating..."
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
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
