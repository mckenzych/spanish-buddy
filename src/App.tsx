import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/layout/Layout";
import Home from "./pages/Home";
import LearnPath from "./pages/LearnPath";
import LessonPlayer from "./pages/LessonPlayer";
import ChatTutor from "./pages/ChatTutor";
import Practice from "./pages/Practice";
import Pronunciation from "./pages/Pronunciation";
import ProgressPage from "./pages/Progress";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/learn" element={<LearnPath />} />
              <Route path="/lesson/:lessonId" element={<LessonPlayer />} />
              <Route path="/chat" element={<ChatTutor />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/pronunciation" element={<Pronunciation />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
