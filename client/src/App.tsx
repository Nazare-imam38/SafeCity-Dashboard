import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SplashScreen } from "@/components/layout/SplashScreen";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Comparison from "@/pages/Comparison";
import Finance from "@/pages/Finance";
import GISLayers from "@/pages/GISLayers";
import Settings from "@/pages/Settings";
import ProjectDetail from "@/pages/ProjectDetail";
import { useState, useEffect, useRef } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/comparison" component={Comparison} />
      <Route path="/finance" component={Finance} />
      <Route path="/gis" component={GISLayers} />
      <Route path="/settings" component={Settings} />
      <Route path="/project/:tehsil/:projectId" component={ProjectDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [location] = useLocation();
  const previousLocation = useRef<string | null>(null);
  const isInitialLoad = useRef<boolean>(true);

  useEffect(() => {
    // On initial load, show splash screen first
    if (isInitialLoad.current) {
      previousLocation.current = location;
      return;
    }

    // If route changed (navigation), show splash screen
    if (previousLocation.current !== null && previousLocation.current !== location) {
      setShowSplash(true);
    }
    
    previousLocation.current = location;
  }, [location]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  };

  return (
    <>
      {/* Router is always mounted to detect route changes */}
      <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>
        <Router />
      </div>
      {/* Splash screen overlays on top */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;