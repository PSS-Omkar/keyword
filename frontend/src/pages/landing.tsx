import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary rounded-xl flex items-center justify-center">
            <FolderKanban className="text-white text-2xl" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">Traffid Projects</h2>
          <p className="mt-2 text-sm text-slate-600">Manage your advertising projects and campaigns</p>
          </div>

          {/* Login Card */}
          <Card className="shadow-lg border border-slate-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-slate-600">
                Sign in to access your project dashboard and manage campaigns across multiple advertisers.
                </p>
                
                <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full"
                size="lg"
                >
                  Sign in to Dashboard
                </Button>
                
                <div className="text-xs text-slate-500 space-y-1">
                  <p>✓ Manage multiple projects</p>
                  <p>✓ Create and track campaigns</p>
                  <p>✓ Multi-language & country support</p>
                  <p>✓ API access for integrations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <FolderKanban className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">Traffid Projects</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-700 transition-colors">
                Privacy Policy
              </Link>
              <span>© {new Date().getFullYear()} Traffid AI Ltd. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
