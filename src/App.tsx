import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import RequireRole from "@/components/auth/RequireRole";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

import LearnerLayout from "./layouts/LearnerLayout";
import CreatorLayout from "./layouts/CreatorLayout";
import AdminLayout from "./layouts/AdminLayout";

import Dashboard from "./pages/learner/Dashboard";
import Quizzes from "./pages/learner/Quizzes";
import KnowledgeGraphPage from "./pages/learner/KnowledgeGraphPage";
import Analytics from "./pages/learner/Analytics";
import Tutor from "./pages/learner/Tutor";
import Leaderboard from "./pages/learner/Leaderboard";
import Profile from "./pages/learner/Profile";
import Courses from "./pages/learner/Courses";
import CourseDetails from "./pages/learner/CourseDetails";
import QuizDetails from "./pages/learner/QuizDetails";

import ManageCourses from "./pages/creator/ManageCourses";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<Onboarding />} />

              {/* Root redirect */}
              <Route path="/" element={<Navigate to="/app/dashboard" replace />} />

              {/* Learner App - student only */}
              <Route
                path="/app"
                element={
                  <RequireRole allowed={["student"]}>
                    <LearnerLayout />
                  </RequireRole>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="courses" element={<Courses />} />
                <Route path="courses/:id" element={<CourseDetails />} />
                <Route path="quizzes" element={<Quizzes />} />
                <Route path="quizzes/:id" element={<QuizDetails />} />
                <Route path="knowledge" element={<KnowledgeGraphPage />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="tutor" element={<Tutor />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Creator App - instructor/admin */}
              <Route
                path="/creator"
                element={
                  <RequireRole allowed={["instructor", "admin"]}>
                    <CreatorLayout />
                  </RequireRole>
                }
              >
                <Route index element={<Navigate to="content" replace />} />
                <Route path="content" element={<ManageCourses />} />
                <Route path="courses" element={<ManageCourses />} />
                <Route path="quizzes" element={<ManageCourses />} />
              </Route>

              {/* Admin App - admin only */}
              <Route
                path="/admin"
                element={
                  <RequireRole allowed={["admin"]}>
                    <AdminLayout />
                  </RequireRole>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminDashboard />} />
                <Route path="courses" element={<AdminDashboard />} />
                <Route path="quizzes" element={<AdminDashboard />} />
                <Route path="logs" element={<AdminDashboard />} />
                <Route path="settings" element={<AdminDashboard />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;