import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <i className="fab fa-twitter text-white text-xl"></i>
            </div>
            <h1 className="text-4xl font-bold text-slate-800">TweetBot AI</h1>
          </div>
          <p className="text-xl text-slate-600">
            Automated Twitter Growth Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-robot text-blue-600 text-xl"></i>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">AI Content Generation</h3>
              <p className="text-sm text-slate-600">
                Generate engaging tweets using advanced AI that understands your audience and trending topics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-calendar-alt text-emerald-600 text-xl"></i>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Smart Scheduling</h3>
              <p className="text-sm text-slate-600">
                Schedule tweets for optimal engagement times with our intelligent posting system.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-bar text-purple-600 text-xl"></i>
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">Growth Analytics</h3>
              <p className="text-sm text-slate-600">
                Track your growth with detailed analytics and insights to optimize your Twitter strategy.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Get Started</h2>
            <p className="text-slate-600 mb-6">
              Sign in to connect your Twitter account and start growing your audience with AI-powered content.
            </p>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-500">
          <p>Secure • Automated • Growth-Focused</p>
        </div>
      </div>
    </div>
  );
}
