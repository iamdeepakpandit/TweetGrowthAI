import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Analytics() {
  return (
    <div className="flex min-h-screen bg-slate-50" data-testid="page-analytics">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader className="border-b border-slate-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Analytics Overview
                </CardTitle>
                <Select defaultValue="30days">
                  <SelectTrigger className="w-40" data-testid="select-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="text-center py-12">
                <i className="fas fa-chart-bar text-slate-400 text-4xl mb-4"></i>
                <h3 className="text-lg font-medium text-slate-800 mb-2">Analytics Coming Soon</h3>
                <p className="text-slate-600">Detailed analytics and insights will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
