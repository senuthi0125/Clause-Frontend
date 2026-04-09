import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  RedirectToSignIn,
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import DashboardPage from "./pages/dashboard-page";
import CalendarPage from "./pages/calendar-page";
import ContractsPage from "./pages/contracts-page";
import ContractTemplatePage from "./pages/contract-template-page";
import CreateContractPage from "./pages/create-contract-page";
import ConflictDetectionPage from "./pages/conflict-detection-page";
import AIAnalysisPage from "./pages/ai-analysis-page";
import WorkflowsPage from "./pages/workflows-page";
import WorkflowDetailPage from "./pages/workflow-detail-page";
import AdminOverviewPage from "./pages/admin-overview-page";
import AdminUsersPage from "./pages/admin-users-page";
import AdminAuditPage from "./pages/admin-audit-page";
import { AuthBridge } from "./components/auth-bridge";

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 px-4 py-8">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route
          path="/sign-in/*"
          element={
            <AuthLayout>
              <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/"
              />
            </AuthLayout>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <AuthLayout>
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/"
              />
            </AuthLayout>
          }
        />

        {/* Protected app routes */}
        <Route
          path="/*"
          element={
            <>
              <SignedIn>
                <AuthBridge />
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/contracts" element={<ContractsPage />} />
                  <Route
                    path="/contracts/new"
                    element={<ContractTemplatePage />}
                  />
                  <Route
                    path="/contracts/create"
                    element={<CreateContractPage />}
                  />
                  <Route path="/ai-analysis" element={<AIAnalysisPage />} />
                  <Route
                    path="/conflict-detection"
                    element={<ConflictDetectionPage />}
                  />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/workflows" element={<WorkflowsPage />} />
                  <Route
                    path="/workflows/:id"
                    element={<WorkflowDetailPage />}
                  />
                  <Route path="/admin" element={<AdminOverviewPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/audit" element={<AdminAuditPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
