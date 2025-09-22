import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Copy, 
  Key, 
  Code, 
  Send, 
  Eye, 
  EyeOff, 
  Book, 
  CheckCircle,
  AlertCircle,
  Globe
} from "lucide-react";

export default function ApiPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showToken, setShowToken] = useState(false);
  const [testEndpoint, setTestEndpoint] = useState("/api/external/projects");
  const [testMethod, setTestMethod] = useState("GET");
  const [testPayload, setTestPayload] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  const apiToken = "traffid-api-key-2025";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-64 bg-slate-200 rounded"></div>
              <div className="h-64 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const testApiEndpoint = async () => {
    setTestLoading(true);
    setTestResponse("");

    try {
      const options: RequestInit = {
        method: testMethod,
        headers: {
          'x-api-key': apiToken,
          'Content-Type': 'application/json',
        },
      };

      if (testMethod !== 'GET' && testPayload) {
        options.body = testPayload;
      }

      const response = await fetch(testEndpoint, options);
      const data = await response.text();
      
      setTestResponse(`Status: ${response.status} ${response.statusText}\n\n${data}`);
    } catch (error) {
      setTestResponse(`Error: ${error}`);
    } finally {
      setTestLoading(false);
    }
  };

  const endpoints = [
    {
      method: "GET",
      path: "/api/external/projects",
      description: "Get all projects with enhanced countries (including location IDs) and languages (including language IDs)",
      example: "curl -H 'x-api-key: traffid-api-key-2025' /api/external/projects"
    },
    {
      method: "GET", 
      path: "/api/external/projects/:id",
      description: "Get specific project with campaigns, enhanced with location IDs and language IDs",
      example: "curl -H 'x-api-key: traffid-api-key-2025' /api/external/projects/1"
    },
    {
      method: "GET",
      path: "/api/external/projects/:id/campaigns", 
      description: "Get campaigns for a project",
      example: "curl -H 'x-api-key: traffid-api-key-2025' /api/external/projects/1/campaigns"
    },
    {
      method: "GET",
      path: "/api/external/projects/:id/keywords", 
      description: "Get keywords for a specific project",
      example: "curl -H 'x-api-key: traffid-api-key-2025' /api/external/projects/1/keywords"
    },
    {
      method: "GET",
      path: "/api/external/keywords",
      description: "Get all keywords across all projects",
      example: "curl -H 'x-api-key: traffid-api-key-2025' /api/external/keywords"
    },
    {
      method: "POST",
      path: "/api/external/keywords",
      description: "Create a new keyword",
      example: `curl -X POST -H 'x-api-key: traffid-api-key-2025' -H 'Content-Type: application/json' \\
  -d '{"projectId": 1, "keyword": "digital marketing", "volume": 1500, "bid": 3.25, "status": "active"}' \\
  /api/external/keywords`
    },
    {
      method: "POST",
      path: "/api/external/keywords/upload",
      description: "Bulk upload keywords via CSV with project name resolution",
      example: `curl -X POST -H 'x-api-key: traffid-api-key-2025' \\
  -F 'file=@keywords.csv' \\
  /api/external/keywords/upload`
    },
    {
      method: "GET",
      path: "/api/external/advertisers",
      description: "Get all advertisers with channel IDs",
      example: "curl -H 'x-api-key: traffid-api-key-2025' /api/external/advertisers"
    },
    {
      method: "GET",
      path: "/api/external/countries",
      description: "Get all available countries with codes, location IDs, and names (113 countries)",
      example: "curl -H 'x-api-key: traffid-api-key-2025' /api/external/countries"
    },
    {
      method: "GET",
      path: "/api/external/languages",
      description: "Get all available languages with codes, language IDs, and names (103 languages)",
      example: "curl -H 'x-api-key: traffid-api-key-2025' /api/external/languages"
    },
    {
      method: "GET",
      path: "/api/external/stats", 
      description: "Get project statistics",
      example: "curl -H 'x-api-key: traffid-api-key-2025' /api/external/stats"
    },
    {
      method: "POST",
      path: "/api/campaigns/create",
      description: "Create campaigns in bulk",
      example: `curl -X POST -H 'x-api-key: traffid-api-key-2025' -H 'Content-Type: application/json' \\
  -d '{"projectId": 1, "campaigns": [{"keyword": "test", "url": "https://example.com", "channelId": "sedo_001", "status": "draft"}]}' \\
  /api/campaigns/create`
    },
    {
      method: "GET",
      path: "/api/external/meta-campaigns",
      description: "Get all Meta campaigns",
      example: "curl -H 'x-api-key: traffid-api-key-2025' /api/external/meta-campaigns"
    },
    {
      method: "POST",
      path: "/api/external/meta-campaigns",
      description: "Create a new Meta campaign configuration",
      example: `curl -X POST -H 'x-api-key: traffid-api-key-2025' -H 'Content-Type: application/json' \\
  -d '{"name": "My Meta Campaign", "projectId": 1, "advertiserId": 2, "adAccountId": "act_123456789", "status": "draft"}' \\
  /api/external/meta-campaigns`
    },
    {
      method: "PATCH",
      path: "/api/external/meta-campaigns/:id",
      description: "Update an existing Meta campaign",
      example: `curl -X PATCH -H 'x-api-key: traffid-api-key-2025' -H 'Content-Type: application/json' \\
  -d '{"status": "active", "budget": 100}' \\
  /api/external/meta-campaigns/1`
    }
  ];

  const samplePayloads = {
    "/api/external/keywords": `{
  "projectId": 1,
  "keyword": "digital marketing services",
  "volume": 2500,
  "bid": 4.75,
  "status": "active"
}`,
    "/api/external/keywords/upload": `CSV Format:
project_name,keyword,volume,bid,status
"Sedo education","online courses",1500,2.50,active
"Sedo education","digital marketing",2000,3.25,active
"Test Project","seo services",1800,2.75,paused`,
    "/api/campaigns/create": `{
  "projectId": 1,
  "campaigns": [
    {
      "keyword": "digital marketing",
      "url": "https://example.com/digital",
      "channelId": "sedo_001",
      "status": "draft",
      "trafficSource": "Google",
      "primaryText": "Best digital marketing solutions",
      "headline": "Transform Your Business",
      "cta": "Get Started",
      "image": "https://example.com/marketing.jpg",
      "video": "https://example.com/demo.mp4"
    },
    {
      "keyword": "seo optimization", 
      "url": "https://example.com/seo",
      "channelId": "sedo_002",
      "status": "active",
      "trafficSource": "Facebook",
      "headline": "SEO Services 2025",
      "cta": "Learn More"
    }
  ]
}`,
    "/api/external/meta-campaigns": `{
  "name": "Facebook Lead Generation Campaign",
  "projectId": 1,
  "advertiserId": 2,
  "adAccountId": "act_123456789",
  "adAccountUser": "primary@example.com",
  "keyword": "digital marketing",
  "countries": ["US", "CA", "GB"],
  "languages": ["en"],
  "dailyBudget": 50,
  "lifetimeBudget": 1500,
  "bid": 2.5,
  "objective": "LEAD_GENERATION",
  "goal": "QUALITY",
  "bidStrategy": "LOWEST_COST_WITHOUT_CAP",
  "placement": "AUTOMATIC_PLACEMENTS",
  "finalUrl": "https://example.com/landing",
  "status": "draft"
}`,
    "/api/external/meta-campaigns/:id": `{
  "status": "active",
  "dailyBudget": 75,
  "bid": 3.0,
  "countries": ["US", "CA", "GB", "AU"],
  "finalUrl": "https://example.com/updated-landing"
}`
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavigationHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Code className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">API Access</h1>
              <p className="mt-1 text-sm text-slate-600">Manage your API integration and test endpoints</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* API Token */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>API Token</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="api-token">Your API Key</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        id="api-token"
                        type={showToken ? "text" : "password"}
                        value={apiToken}
                        readOnly
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowToken(!showToken)}
                      >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(apiToken, "API token")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Keep your API key secure</h4>
                        <p className="text-sm text-blue-800 mt-1">
                          Never expose your API key in client-side code or public repositories.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>API Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Available Endpoints</span>
                    <span className="text-sm text-slate-600">{endpoints.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Authentication</span>
                    <span className="text-sm text-slate-600">API Key Required</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rate Limiting</span>
                    <span className="text-sm text-slate-600">None</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-6">
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                            {endpoint.path}
                          </code>
                        </div>
                        <p className="text-sm text-slate-600">{endpoint.description}</p>
                        <div className="bg-slate-50 rounded p-3">
                          <code className="text-xs font-mono text-slate-700">
                            {endpoint.example}
                          </code>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(endpoint.example, "Example")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoint Tester</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="test-method">Method</Label>
                    <select
                      id="test-method"
                      value={testMethod}
                      onChange={(e) => setTestMethod(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="test-endpoint">Endpoint</Label>
                    <select
                      id="test-endpoint"
                      value={testEndpoint}
                      onChange={(e) => {
                        setTestEndpoint(e.target.value);
                        if (e.target.value === "/api/campaigns/create") {
                          setTestMethod("POST");
                          setTestPayload(samplePayloads["/api/campaigns/create"]);
                        } else if (e.target.value === "/api/external/meta-campaigns") {
                          setTestMethod("POST");
                          setTestPayload(samplePayloads["/api/external/meta-campaigns"]);
                        } else if (e.target.value === "/api/external/meta-campaigns/:id") {
                          setTestMethod("PATCH");
                          setTestPayload(samplePayloads["/api/external/meta-campaigns/:id"]);
                        } else {
                          setTestMethod("GET");
                          setTestPayload("");
                        }
                      }}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
                    >
                      {endpoints.map((endpoint, index) => (
                        <option key={index} value={endpoint.path}>
                          {endpoint.path}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(testMethod === "POST" || testMethod === "PATCH") && (
                  <div>
                    <Label htmlFor="test-payload">Request Body (JSON)</Label>
                    <Textarea
                      id="test-payload"
                      value={testPayload}
                      onChange={(e) => setTestPayload(e.target.value)}
                      placeholder="Enter JSON payload"
                      rows={8}
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                )}

                <Button onClick={testApiEndpoint} disabled={testLoading}>
                  {testLoading ? "Testing..." : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Request
                    </>
                  )}
                </Button>

                {testResponse && (
                  <div>
                    <Label>Response</Label>
                    <Textarea
                      value={testResponse}
                      readOnly
                      rows={10}
                      className="mt-1 font-mono text-sm bg-slate-50"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Book className="h-5 w-5" />
                  <span>API Documentation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <h3>Authentication</h3>
                  <p>All API requests require authentication using your API key. Include it in the request header:</p>
                  <pre className="bg-slate-100 p-3 rounded">
                    <code>x-api-key: {apiToken}</code>
                  </pre>

                  <h3>Campaign Creation API</h3>
                  <p>Create multiple campaigns at once using the bulk creation endpoint:</p>
                  <pre className="bg-slate-100 p-3 rounded text-sm">
                    <code>{`POST /api/campaigns/create
Content-Type: application/json
x-api-key: ${apiToken}

{
  "projectId": 1,
  "campaigns": [
    {
      "keyword": "your keyword",
      "url": "https://example.com/landing",
      "channelId": "sedo_001", 
      "status": "draft"
    }
  ]
}`}</code>
                  </pre>

                  <h3>Meta Campaigns API</h3>
                  <p>Create and manage Meta advertising campaigns with comprehensive configuration options:</p>
                  <pre className="bg-slate-100 p-3 rounded text-sm">
                    <code>{`POST /api/external/meta-campaigns
Content-Type: application/json
x-api-key: ${apiToken}

{
  "name": "Facebook Lead Generation Campaign",
  "projectId": 1,
  "advertiserId": 2,
  "adAccountId": "act_123456789",
  "adAccountUser": "primary@example.com",
  "keyword": "digital marketing",
  "countries": ["US", "CA", "GB"],
  "languages": ["en"],
  "dailyBudget": 50,
  "lifetimeBudget": 1500,
  "bid": 2.5,
  "objective": "LEAD_GENERATION",
  "status": "draft"
}`}</code>
                  </pre>

                  <h3>Response Format</h3>
                  <p>Successful campaign creation returns:</p>
                  <pre className="bg-slate-100 p-3 rounded text-sm">
                    <code>{`{
  "created": 1,
  "total": 1,
  "errors": []
}`}</code>
                  </pre>

                  <h3>Status Values</h3>
                  <ul>
                    <li><code>draft</code> - Campaign is being prepared</li>
                    <li><code>active</code> - Campaign is currently running</li>
                    <li><code>paused</code> - Campaign is temporarily stopped</li>
                    <li><code>completed</code> - Campaign has finished</li>
                  </ul>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-yellow-900">Important Notes</h4>
                    <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                      <li>• Channel IDs must match those available for your advertisers</li>
                      <li>• URLs should include the protocol (https://)</li>
                      <li>• Keywords are required for campaign targeting</li>
                      <li>• All timestamps are in ISO 8601 format (UTC)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}