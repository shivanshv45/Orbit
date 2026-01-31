import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AccessibilityManager } from "./components/accessibility/AccessibilityManager";
import { SessionObserver } from "./components/auth/SessionObserver";
import LandingPage from "./pages/LandingPage";
import CurriculumPage from "./pages/CurriculumPage";
import LearnPage from "./pages/LearnPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <SessionObserver>
                    <AccessibilityManager>
                        <Routes>
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/curriculum" element={<CurriculumPage />} />
                            <Route path="/learn/:subtopicId" element={<LearnPage />} />
                            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </AccessibilityManager>
                </SessionObserver>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;